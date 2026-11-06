// North Wales trip app.
// Plain ES modules and no build step, so the same `web/` folder is the GitHub Pages site
// and the Android app (Capacitor serves it from inside the APK).
import { trip, days, shops, places, placeGroups, tips, directionsTo, mapSearch } from './data.js';
import { Capacitor, registerPlugin } from './vendor/capacitor-core.js';

const VERSION = '1.0.0';
const APK_URL = 'https://github.com/anikeee/north-wales-trip/releases/latest/download/north-wales-trip.apk';
const isNative = Capacitor.isNativePlatform();
document.documentElement.classList.toggle('is-native', isNative);
const view = document.getElementById('view');

/* ---------- Storage. Every call is guarded: private windows or blocked storage must not break the app. ---------- */
const store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* the app still works, it just forgets on reload */
    }
  },
};
const state = {
  done: new Set(store.read('nw.done', [])),
  starred: new Set(store.read('nw.starred', [])),
  lastTick: Number(store.read('nw.lastTick', 0)) || 0,
  open: new Set(),
};
function persist() {
  store.write('nw.done', [...state.done]);
  store.write('nw.starred', [...state.starred]);
  store.write('nw.lastTick', state.lastTick);
}

/* ---------- Lookups ---------- */
const placeById = new Map(places.map((p) => [p.id, p]));
const dayById = new Map(days.map((d) => [d.id, d]));
const allStops = days.flatMap((d) => d.stops);
const FIRST = days[0];
const LAST = days[days.length - 1];

/* ---------- Time. Everything runs on UK time, wherever the phone thinks it is. ---------- */
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const utcOf = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const weekdayOf = (iso) => new Date(utcOf(iso)).getUTCDay();
const dayDiff = (a, b) => Math.round((utcOf(b) - utcOf(a)) / 86400000);
const TRIP_START = toMin(FIRST.stops[0].time);
const TRIP_END = toMin(trip.end.slice(11));

// `?now=2026-11-07T10:20` freezes the clock at that UK time, to check each part of the trip.
const override = (() => {
  try {
    const v = new URLSearchParams(location.search).get('now');
    return v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
})();

function now() {
  if (override) {
    const date = override.slice(0, 10);
    return { date, minutes: toMin(override.slice(11)), weekday: weekdayOf(date) };
  }
  const d = new Date();
  try {
    const parts = {};
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: trip.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    for (const p of fmt.formatToParts(d)) parts[p.type] = p.value;
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    return { date, minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute), weekday: weekdayOf(date) };
  } catch {
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { date, minutes: d.getHours() * 60 + d.getMinutes(), weekday: d.getDay() };
  }
}
const clockText = (t) => `${pad(Math.floor(t.minutes / 60))}:${pad(t.minutes % 60)}`;
const dateText = (iso) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${WD[weekdayOf(iso)]} ${d} ${MONTH[m - 1]}`;
};
const durationText = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
};
// Shop hours as the PDF writes them: "22:00" -> "10pm", "09:30" -> "9:30am", "24:00" -> "midnight".
function hourText(hhmm) {
  const mins = toMin(hhmm) % 1440;
  if (mins === 0) return 'midnight';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h % 12 || 12}${m ? `:${pad(m)}` : ''}${h < 12 ? 'am' : 'pm'}`;
}

function phaseOf(t) {
  if (t.date < FIRST.date || (t.date === FIRST.date && t.minutes < TRIP_START)) return 'before';
  if (t.date > LAST.date || (t.date === LAST.date && t.minutes >= TRIP_END)) return 'after';
  return 'during';
}
const tripDayOf = (t) => days.find((d) => d.date === t.date) || null;

// Where the family is in a day.
// While you are ticking stops (a tick in the last 3 hours), Today follows your ticks, so a late
// start doesn't skip stops. Otherwise it follows the clock, so a forgotten tick can't freeze it.
function focusFor(day, t) {
  const stops = day.stops;
  const isToday = t.date === day.date;
  let lastDone = -1;
  stops.forEach((s, i) => {
    if (state.done.has(s.id)) lastDone = i;
  });
  let timeIdx = -1;
  if (isToday) {
    stops.forEach((s, i) => {
      if (toMin(s.time) <= t.minutes) timeIdx = i;
    });
  }
  const ticking = lastDone >= 0 && (!isToday || override || Date.now() - state.lastTick < 3 * 3600 * 1000);
  let index;
  let label;
  let by;
  if (ticking) {
    index = stops.findIndex((s, i) => i > lastDone && !state.done.has(s.id));
    label = 'Up next';
    by = 'ticks';
  } else {
    by = 'clock';
    if (timeIdx === -1) {
      index = stops.findIndex((s) => !state.done.has(s.id));
      label = 'First up';
    } else {
      const last = stops.length - 1;
      if (timeIdx === last && day !== LAST && t.minutes >= toMin(stops[last].time) + 90) {
        return { complete: true, by };
      }
      index = timeIdx;
      label = 'Now';
      // A drive stop ("Leave The Cherries") means you're on the road: point at where you're going.
      if (stops[index].kind === 'drive' && index < last) {
        index += 1;
        label = 'Up next';
      }
      while (index < stops.length && state.done.has(stops[index].id)) {
        index += 1;
        label = 'Up next';
      }
    }
  }
  if (index === -1 || index >= stops.length) return { complete: true, by };
  return { complete: false, index, label, by };
}

function shopStatus(shop, t) {
  const hoursOn = (wd) => (wd === 0 ? shop.hours.sun : shop.hours.all) || shop.hours.all;
  const [o, c] = hoursOn(t.weekday);
  const open = toMin(o);
  const close = toMin(c);
  if (t.minutes >= open && t.minutes < close) {
    return close - t.minutes <= 60
      ? { open: true, tone: 'soon', label: `Closes ${hourText(c)}` }
      : { open: true, tone: 'open', label: `Open until ${hourText(c)}` };
  }
  if (t.minutes < open) return { open: false, tone: 'closed', label: `Opens ${hourText(o)}` };
  const next = (t.weekday + 1) % 7;
  return { open: false, tone: 'closed', label: `Opens ${WD[next]} ${hourText(hoursOn(next)[0])}` };
}

/* ---------- HTML helpers ---------- */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ICONS = {
  nav: '<path d="M3 11l18-8-8 18-2-8-8-2z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  car: '<path d="M4 15v-3.5L6 7h12l2 4.5V15z"/><path d="M6 15v2.5M18 15v2.5"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.2-3 3.6-3 7.5h3"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 10 4.25 4.25 0 0 0 7 18.5z"/>',
  'sun-cloud': '<path d="M9 3v1.5M3.7 5.2l1 1M2 10.5h1.5M14.3 5.2l-1 1"/><path d="M5.6 13A4 4 0 1 1 12.6 8.7"/><path d="M9.5 20h8a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.5 1.5A2.75 2.75 0 0 0 9.5 20z"/>',
  'sun-rain': '<path d="M9 2.5V4M3.9 4.6l1 1M2 9.5h1.5M14.1 4.6l-1 1"/><path d="M5.5 12A3.75 3.75 0 1 1 12 7.9"/><path d="M9.5 17h8a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.5 1.5A2.75 2.75 0 0 0 9.5 17z"/><path d="M11 20l-.8 1.6M15 20l-.8 1.6"/>',
};
const icon = (name, size = 20, stroke = 1.9) =>
  `<svg class="icon" aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
const ext = (href, cls, inner, extra = '') =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener"${extra}>${inner}</a>`;
const placeImg = (id, cls, lazy) =>
  `<img class="${cls}" src="img/places/${id}.webp" alt="" width="629" height="351"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
const DETAIL_LABEL = { parking: 'Parking', food: 'Food', toilets: 'Toilets' };
const BADGE = { parking: 'P', food: 'Food', toilets: 'WC' };
const badgeFor = (kind) =>
  `<span class="badge${kind === 'toilets' ? ' badge-wc' : ''}" aria-hidden="true">${kind === 'food' ? icon('food', 15, 2) : BADGE[kind]}</span>`;

function renderItem(item) {
  const toneClass = item.tone === 'halal' ? 'tone-halal' : item.tone === 'ask' ? 'tone-ask' : '';
  const tag = item.tag ? `<b class="${toneClass}">${esc(item.tag)}:</b> ` : '';
  let body;
  if (item.venues) {
    body = item.venues
      .map((v) => (v.lead ? esc(v.lead) : ext(mapSearch(v.q), 'venue', esc(v.name)) + (v.joiner ?? ', ') + esc(v.text)))
      .join(' ');
  } else {
    body = esc(item.text);
    if (item.q) body += ` ${ext(mapSearch(item.q), 'inline-map', 'Map', ` aria-label="Map: ${esc(item.q)}"`)}`;
  }
  return `<p>${tag}${body}</p>`;
}

// The strongest food note in a stop, for the chip on a closed stop: halal, then ask, then veg.
function foodTone(stop) {
  const items = (stop.details || []).filter((d) => d.kind === 'food').flatMap((d) => d.items);
  if (items.some((i) => i.tone === 'halal')) return { tone: 'halal', label: 'Halal' };
  if (items.some((i) => i.tone === 'ask')) return { tone: 'ask', label: 'Ask if halal' };
  if (items.some((i) => i.tone === 'veg')) return { tone: 'veg', label: 'Vegetarian' };
  return null;
}

function routeUrl(day) {
  const r = day.route;
  const q = new URLSearchParams({ api: '1' });
  if (r.origin) q.set('origin', r.origin);
  q.set('destination', r.destination);
  if (r.waypoints.length) q.set('waypoints', r.waypoints.join('|'));
  q.set('travelmode', 'driving');
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

/* ---------- Shared blocks ---------- */
const topbar = (t) =>
  `<header class="topbar"><div class="brand"><img src="img/icons/favicon.svg" alt="" width="28" height="28"><span>North Wales</span></div><span class="clock">${dateText(t.date)} · ${clockText(t)}</span></header>`;

function weatherCard(day, withSunset) {
  const side = withSunset
    ? `<div class="weather-side"><span class="label-caps">Sunset</span><span class="strong num">${trip.sun.set}</span></div>`
    : '';
  return `<section class="card weather" aria-label="Weather">${icon(day.weather.icon, 26, 1.7)}<div class="weather-main"><span class="weather-summary">${esc(day.weather.summary)}</span><span class="weather-note">${esc(day.weather.note)}</span></div>${side}</section>`;
}

function dayHead(day, line, headingTag, small) {
  return `<div class="day-head"><div class="day-line"><span class="pill">${esc(day.label)}</span><span>${esc(line)}</span></div><${headingTag} class="day-title${small ? ' is-small' : ''}">${esc(day.title)}</${headingTag}></div>`;
}

function dayPreview(day, eyebrow) {
  const first = day.stops[0];
  return `<section class="card-white preview day-${day.id}">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <div class="day-line"><span class="pill">${esc(day.label)}</span><span>${esc(day.driving)}</span></div>
    <h2 class="day-title is-small">${esc(day.title)}</h2>
    <p class="weather-note">${esc(day.weather.summary)}. ${esc(day.weather.note)}</p>
    ${first.text ? `<p class="focus-text"><b class="num">${first.time}</b> ${esc(first.title)}. ${esc(first.text)}</p>` : ''}
    <ol class="mini-stops">${day.stops.map((s) => `<li><span class="num">${s.time}</span><span>${esc(s.title)}</span></li>`).join('')}</ol>
    <a class="btn btn-primary" href="#/plan/${day.id}">See ${esc(day.label)}</a>
  </section>`;
}

function tiles(t) {
  const statuses = shops.map((s) => shopStatus(s, t));
  const open = statuses.filter((s) => s.open).length;
  const soon = statuses.some((s) => s.tone === 'soon');
  const sub = open === shops.length ? `All ${open} open now` : open === 0 ? 'All closed now' : `${open} of ${shops.length} open now`;
  return `<div class="tiles">
    <a class="tile" href="#/shops">${icon('bag')}<span class="tile-title">Food shops</span><span class="tile-sub ${soon ? 'warn' : open ? 'ok' : ''}">${sub}</span></a>
    ${ext(trip.stay.directions, 'tile', `${icon('home')}<span class="tile-title">The Cherries</span><span class="tile-sub">Directions home</span>`)}
  </div>`;
}

/* ---------- Today ---------- */
function viewToday(t) {
  const phase = phaseOf(t);
  if (phase === 'before') return { html: topbar(t) + todayBefore(t), day: FIRST };
  if (phase === 'after') return { html: topbar(t) + todayAfter(), day: LAST };
  const day = tripDayOf(t);
  return { html: topbar(t) + todayDuring(day, t), day };
}

function todayBefore(t) {
  const until = dayDiff(t.date, FIRST.date);
  let title;
  let sub;
  if (until <= 0) {
    title = `Leave London at ${FIRST.stops[0].time}`;
    sub = `In ${durationText(TRIP_START - t.minutes)}. ${FIRST.driving}.`;
  } else {
    title = until === 1 ? 'The trip starts tomorrow' : `The trip starts in ${until} days`;
    sub = 'Friday 6 to Monday 9 November, three nights at The Cherries.';
  }
  return `<section class="hero"><h1 class="hero-title">${esc(title)}</h1><p class="hero-sub">${esc(sub)}</p></section>
    ${dayPreview(FIRST, 'First day')}
    <section class="card stay-mini" aria-label="Check in">
      <div class="info-rows" style="border-top: 0; padding-top: 0">
        <div class="info-row"><span class="badge">${icon('home', 15, 2)}</span><span><b>Check in</b> ${esc(trip.stay.checkIn)}. ${esc(trip.stay.address)}.</span></div>
      </div>
    </section>
    ${tiles(t)}`;
}

function todayAfter() {
  const done = allStops.filter((s) => state.done.has(s.id)).length;
  const starred = places.filter((p) => state.starred.has(p.id));
  return `<section class="hero"><h1 class="hero-title">Hope you had a lovely trip</h1><p class="hero-sub">You ticked ${done} of ${allStops.length} stops.</p></section>
    ${starred.length ? `<section class="card"><h2 class="then-title">Starred for next time</h2><ul class="mini-stops">${starred.map((p) => `<li><span class="num">${icon('star', 16)}</span><a href="#/places/starred/${p.id}">${esc(p.name)}</a></li>`).join('')}</ul></section>` : ''}
    <a class="btn btn-outline" href="#/plan/fri">Look back at the plan</a>`;
}

function todayDuring(day, t) {
  const n = days.indexOf(day) + 1;
  const f = focusFor(day, t);
  let html = dayHead(day, `Day ${n} of ${days.length} · ${day.driving}`, 'h1', false) + weatherCard(day, true);
  html += f.complete ? eveningCard(day) : focusCard(day, f) + thenRow(day, f);
  html += progressBlock(day, f) + tiles(t);
  return html;
}

function focusCard(day, f) {
  const s = day.stops[f.index];
  const done = state.done.has(s.id);
  const rows = (s.details || [])
    .map((d) => `<div class="info-row">${badgeFor(d.kind)}<div>${renderItem(d.items[0])}</div></div>`)
    .join('');
  const actions = [];
  if (s.dest) actions.push(ext(directionsTo(s.dest), 'btn btn-primary btn-grow', `${icon('nav', 18, 2)}${esc(s.destLabel || 'Directions')}`));
  if (s.link) actions.push(`<a class="btn btn-outline btn-grow" href="${s.link.href}">${esc(s.link.label)}</a>`);
  actions.push(`<button type="button" class="btn btn-outline" data-action="done" data-id="${s.id}" data-focus="focus-done" aria-pressed="${done}">${icon('check', 18, 2.4)}${done ? 'Done' : 'Mark done'}</button>`);
  return `<section class="card-white focus" aria-label="${esc(f.label)}">
    ${s.place ? placeImg(s.place, 'focus-img', false) : ''}
    <div class="focus-body">
      <div class="focus-top"><span class="eyebrow">${esc(f.label)} · ${s.time}</span>${s.drive ? `<span class="chip">${icon('car', 14, 2)}${esc(s.drive)}</span>` : ''}</div>
      <div><h2 class="focus-title">${esc(s.title)}</h2>${s.text ? `<p class="focus-text">${esc(s.text)}</p>` : ''}</div>
      ${rows ? `<div class="info-rows">${rows}</div>` : ''}
      ${s.details ? `<a class="small strong" href="#/plan/${day.id}/${s.id}">All parking, food and toilet notes</a>` : ''}
      <div class="btn-row">${actions.join('')}</div>
    </div>
  </section>`;
}

function thenRow(day, f) {
  const next = day.stops[f.index + 1];
  if (!next) return '';
  return `<a class="card then" href="#/plan/${day.id}/${next.id}"><span class="strong num">${next.time}</span><span class="then-text"><span class="then-title">Then ${esc(next.title)}</span>${next.text ? `<span class="then-sub">${esc(next.text)}</span>` : ''}</span>${icon('chevron', 18, 2)}</a>`;
}

function eveningCard(day) {
  const next = days[days.indexOf(day) + 1];
  if (!next) {
    return `<section class="card-white preview"><p class="eyebrow">All done</p><h2 class="focus-title">Safe trip home</h2><p class="focus-text">${esc(LAST.stops[LAST.stops.length - 1].text || '')}</p></section>`;
  }
  return dayPreview(next, `That’s ${WEEKDAY[weekdayOf(day.date)]} done. Tomorrow`);
}

function progressBlock(day, f) {
  const total = day.stops.length;
  const count = day.stops.filter((s) => state.done.has(s.id)).length;
  const segs = day.stops.map((s) => `<span${state.done.has(s.id) ? ' class="on"' : ''}></span>`).join('');
  const hint = f.by === 'ticks' ? 'Following your ticks.' : 'Following the clock. Tick stops as you go and Today keeps up.';
  return `<section class="progress" aria-label="Progress today"><div class="progress-top"><span class="strong">${count} of ${total} stops done</span><a class="strong" href="#/plan/${day.id}">See the whole day</a></div><div class="segments" aria-hidden="true">${segs}</div><p class="hint">${hint}</p></section>`;
}

/* ---------- Plan ---------- */
function defaultPlanDay(t) {
  const phase = phaseOf(t);
  if (phase === 'during') return tripDayOf(t);
  return phase === 'after' ? LAST : FIRST;
}

function viewPlan(dayId, t) {
  const day = dayById.get(dayId) || defaultPlanDay(t);
  const f = phaseOf(t) === 'during' && t.date === day.date ? focusFor(day, t) : null;
  const tabs = days
    .map((d) => `<a class="day-tab day-${d.id}" href="#/plan/${d.id}"${d === day ? ' aria-current="page"' : ''}><span class="day-tab-name">${d.short}</span><span class="day-tab-num">${Number(d.date.slice(8))}</span></a>`)
    .join('');
  const html = `<div class="topbar"><h1 class="page-title">Your plan</h1><span class="clock">Fri 6 to Mon 9 Nov</span></div>
    <nav class="day-tabs" aria-label="Days">${tabs}</nav>
    ${dayHead(day, day.driving, 'h2', true)}
    ${weatherCard(day, false)}
    ${ext(routeUrl(day), 'btn btn-outline', `${icon('route', 18)}Whole day in Google Maps`)}
    <p class="lede">Tap a stop for parking, food and toilets. Tick it when you’re done and Today moves on.</p>
    <ol class="timeline">${day.stops.map((s, i) => stopItem(day, s, i, f)).join('')}</ol>
    <p class="small">${esc(trip.weatherNote)}</p>`;
  return { html, day };
}

function stopItem(day, s, i, f) {
  const done = state.done.has(s.id);
  const expandable = Boolean((s.details && s.details.length) || s.dest || s.link);
  const open = expandable && state.open.has(s.id);
  const isFocus = f && !f.complete && f.index === i;
  const meta = [];
  if (s.drive) meta.push(`<span class="chip">${esc(s.drive)}</span>`);
  (s.details || []).forEach((d) => meta.push(`<span class="mini">${BADGE[d.kind]}</span>`));
  const tone = foodTone(s);
  if (tone) meta.push(`<span class="tone-chip tone-${tone.tone}">${tone.label}</span>`);
  if (expandable) meta.push(`<span class="more" aria-hidden="true">Details${icon('down', 16, 2.2)}</span>`);
  const inner = `<span class="stop-title-row"><span class="stop-title">${esc(s.title)}</span>${isFocus ? `<span class="tag-next">${esc(f.label)}</span>` : ''}</span>
      ${s.text ? `<span class="stop-text">${esc(s.text)}</span>` : ''}
      ${meta.length ? `<span class="stop-meta">${meta.join('')}</span>` : ''}`;
  const head = expandable
    ? `<button type="button" class="stop-head" data-action="open" data-id="${s.id}" aria-expanded="${open}" aria-controls="panel-${s.id}">${inner}</button>`
    : `<div class="stop-head">${inner}</div>`;
  const panel = expandable
    ? `<div class="stop-panel card-white" id="panel-${s.id}"${open ? '' : ' hidden'}>${open ? panelContent(s) : ''}</div>`
    : '';
  return `<li class="stop${done ? ' is-done' : ''}" id="stop-${s.id}">
    <span class="stop-time">${s.time}</span>
    <span class="stop-rail" aria-hidden="true"><span class="stop-dot"></span></span>
    <div class="stop-body">${head}</div>
    <button type="button" class="stop-check" data-action="done" data-id="${s.id}" data-focus="check-${s.id}" aria-pressed="${done}" aria-label="Done: ${esc(s.title)}"><span class="ring">${icon('check', 15, 3)}</span></button>
    ${panel}
  </li>`;
}

function panelContent(s) {
  const place = s.place ? placeById.get(s.place) : null;
  const rows = (s.details || [])
    .map((d) => `<div class="detail"><span class="detail-label">${badgeFor(d.kind)}${DETAIL_LABEL[d.kind]}</span><div class="detail-items">${d.items.map(renderItem).join('')}</div></div>`)
    .join('');
  const actions = [];
  if (s.dest) actions.push(ext(directionsTo(s.dest), 'btn btn-primary btn-grow', `${icon('nav', 17, 2)}${esc(s.destLabel || 'Directions')}`));
  if (s.link) actions.push(`<a class="btn btn-outline btn-grow" href="${s.link.href}">${esc(s.link.label)}</a>`);
  if (place) actions.push(`<a class="btn btn-outline" href="#/places/all/${place.id}">About</a>`);
  return `${place ? placeImg(place.id, 'stop-img', false) : ''}<div class="details">${rows}${actions.length ? `<div class="btn-row">${actions.join('')}</div>` : ''}</div>`;
}

/* ---------- Places ---------- */
const FILTERS = [
  { id: 'all', label: 'All', keep: () => true },
  { id: 'plan', label: 'In the plan', keep: (p) => Boolean(p.day) },
  { id: 'optional', label: 'Optional extras', keep: (p) => !p.day },
  { id: 'starred', label: 'Starred', keep: (p) => state.starred.has(p.id) },
];

function viewPlaces(filterId) {
  const filter = FILTERS.find((f) => f.id === filterId) || FILTERS[0];
  const chips = FILTERS.map(
    (f) => `<a class="filter" href="#/places/${f.id}"${f === filter ? ' aria-current="page"' : ''}>${f.label} <span class="count">${places.filter(f.keep).length}</span></a>`,
  ).join('');
  const groups = placeGroups
    .map((g) => ({ ...g, items: places.filter((p) => p.group === g.id && filter.keep(p)) }))
    .filter((g) => g.items.length);
  const body = groups.length
    ? groups
        .map((g) => `<section class="group" aria-labelledby="g-${g.id}"><div class="group-head"><h2 class="group-title" id="g-${g.id}">${esc(g.title)}</h2><p class="lede">${esc(g.text)}</p></div><div class="places">${g.items.map(placeCard).join('')}</div></section>`)
        .join('')
    : '<p class="empty">Nothing starred yet. Tap the star on any place to keep it here.</p>';
  return {
    html: `<div style="display:flex;flex-direction:column;gap:6px"><h1 class="page-title">Places to visit</h1><p class="lede">Every place, closest first from The Cherries. Star the extras you like.</p></div>
      <nav class="filters" aria-label="Show">${chips}</nav>${body}
      <p class="small">The pictures on each card are illustrations.</p>`,
    day: null,
  };
}

function placeCard(p) {
  const day = p.day ? dayById.get(p.day) : null;
  const starred = state.starred.has(p.id);
  const badges = day
    ? `<a class="pill day-${day.id}" href="#/plan/${day.id}">${WEEKDAY[weekdayOf(day.date)]}</a><span>${esc(day.weather.short)}</span>`
    : '<span class="optional-chip">Optional extra</span><span>Not in the plan yet</span>';
  return `<article class="place" id="place-${p.id}">
    ${placeImg(p.id, 'place-img', true)}
    <div class="place-body">
      <div><h3 class="place-name">${esc(p.name)}</h3><p class="place-drive">${esc(p.drive)} from The Cherries</p></div>
      <div class="place-badges">${badges}</div>
      <p class="place-text">${esc(p.text)}</p>
      <div class="btn-row">
        ${ext(p.maps, 'btn btn-outline btn-grow', `${icon('pin', 17)}Map and directions`)}
        <button type="button" class="star" data-action="star" data-id="${p.id}" data-focus="star-${p.id}" aria-pressed="${starred}" aria-label="Star ${esc(p.name)}">${icon('star', 20, 1.8)}</button>
      </div>
    </div>
  </article>`;
}

/* ---------- Shops ---------- */
function viewShops(t) {
  const rows = shops.map((s) => ({ s, st: shopStatus(s, t) }));
  const big = rows.filter((r) => r.s.hours.sun && r.s.hours.sun[1] === '16:00');
  let notice;
  if (t.weekday === 0 && t.minutes < toMin('16:00')) {
    notice = `<div class="notice notice-warn" role="note">${icon('clock', 22)}<div><p class="notice-title">The big supermarkets close at 4pm today</p><p class="notice-text">Sunday hours for ${esc(big.map((r) => r.s.name.replace(' Llandudno', '')).join(', '))}.</p></div></div>`;
  } else if (t.weekday === 0) {
    const later = rows.filter((r) => r.st.open).map((r) => r.s.name);
    notice = `<div class="notice notice-calm" role="note">${icon('clock', 22)}<div><p class="notice-title">The big supermarkets have closed for Sunday</p><p class="notice-text">${later.length ? `Still open: ${esc(later.join(', '))}.` : 'Everything is closed now.'}</p></div></div>`;
  } else {
    notice = `<div class="notice notice-calm" role="note">${icon('clock', 22)}<div><p class="notice-title">The big supermarkets close at 4pm on Sunday</p><p class="notice-text">Stock up on Friday or Saturday.</p></div></div>`;
  }
  const list = rows
    .map(({ s, st }) => {
      const address = s.halalNote
        ? `${esc(s.address)} <b class="tone-halal">${esc(s.halalNote)}</b>, ${esc(s.after)}`
        : esc(s.address);
      return `<li class="shop">
        <div class="shop-top"><h2 class="shop-name">${esc(s.name)}</h2><span class="status status-${st.tone}">${esc(st.label)}</span></div>
        <p class="shop-address">${address}</p>
        <div class="shop-bottom"><span class="shop-hours"><b>${esc(s.drive)}</b><span class="muted">${esc(s.hoursText)}</span></span>${ext(s.maps, 'btn btn-outline btn-sm', `${icon('nav', 16, 2)}Directions`)}</div>
      </li>`;
    })
    .join('');
  return {
    html: `<div style="display:flex;flex-direction:column;gap:6px"><div class="topbar"><h1 class="page-title">Food shops</h1><span class="clock">${dateText(t.date)} · ${clockText(t)}</span></div><p class="lede">Near The Cherries, closest first. ${rows.filter((r) => r.st.open).length} of ${rows.length} open now.</p></div>
      ${notice}<ul class="shop-list">${list}</ul>
      <p class="small">Opening hours are from Google Maps. Open or closed uses UK time.</p>`,
    day: null,
  };
}

/* ---------- Info ---------- */
function viewInfo() {
  const s = trip.stay;
  const getApp = isNative
    ? ''
    : `<section class="get-app" aria-label="Android app">
        <div class="get-app-head"><img src="img/icons/icon-192.png" alt="" width="44" height="44"><div><h2>Get the Android app</h2><p class="soft">Opens like an app and works with no signal.</p></div></div>
        <a class="btn btn-light" href="${APK_URL}">${icon('download', 18, 2)}Download the APK</a>
        <p class="small">Android will ask you to allow installs from your browser. The app is not on the Play Store. On iPhone, open this page in Safari, tap Share, then Add to Home Screen.</p>
      </section>`;
  return {
    html: `<h1 class="page-title">Stay and good to know</h1>
      <section class="card-white stay" aria-labelledby="stay-name">
        <div style="display:flex;flex-direction:column;gap:4px"><span class="label-caps">Where you’re staying</span><h2 class="stay-name" id="stay-name">${esc(s.name)}</h2><p>${esc(s.address)}</p></div>
        <dl class="facts"><div><dt>Check in</dt><dd>${esc(s.checkIn)}</dd></div><div><dt>Check out</dt><dd>${esc(s.checkOut)}</dd></div><div><dt>Guests</dt><dd>${esc(s.guests)}</dd></div></dl>
        <div class="btn-row">${ext(s.directions, 'btn btn-dark', `${icon('nav', 17, 2)}Directions`)}${ext(s.maps, 'btn btn-outline', 'Open in Maps')}</div>
      </section>
      <section class="daylight" aria-label="Daylight">
        <div class="card"><span class="small">Sunrise about</span><span class="big-num">${trip.sun.rise}</span></div>
        <div class="card"><span class="small">Sunset about</span><span class="big-num">${trip.sun.set}</span></div>
      </section>
      <section style="display:flex;flex-direction:column;gap:10px" aria-labelledby="gtk"><h2 class="section-title" id="gtk">Good to know</h2>
        <div class="tips">${tips.map((tip) => `<div class="tip"><h3${tip.title === 'Halal food' ? ' class="tone-halal"' : ''}>${esc(tip.title)}</h3><p>${esc(tip.text)}</p></div>`).join('')}</div>
      </section>
      <p class="small">${esc(trip.weatherNote)}</p>
      ${getApp}
      <p class="small">${esc(trip.sources)}</p>
      <button type="button" class="link-btn" data-action="reset">Clear my ticks and stars</button>
      <p class="small">Version ${VERSION}${isNative ? ', Android app' : ''}.</p>`,
    day: null,
  };
}

/* ---------- Router and render ---------- */
const TITLES = { today: 'Today', plan: 'Plan', places: 'Places', shops: 'Food shops', info: 'Info' };
function parseRoute() {
  const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const name = TITLES[parts[0]] ? parts[0] : 'today';
  return { name, a: parts[1] || null, b: parts[2] || null };
}

let lastHash = null;
let hasNavigated = false;
function render() {
  const t = now();
  const r = parseRoute();
  const hash = location.hash || '#/today';
  const routeChanged = hash !== lastHash;
  if (routeChanged && r.name === 'plan' && r.b) state.open.add(r.b);
  const active = document.activeElement;
  const focusKey = active && view.contains(active) ? active.getAttribute('data-focus') : null;

  let out;
  if (r.name === 'plan') out = viewPlan(r.a, t);
  else if (r.name === 'places') out = viewPlaces(r.a);
  else if (r.name === 'shops') out = viewShops(t);
  else if (r.name === 'info') out = viewInfo();
  else out = viewToday(t);

  view.className = `view${out.day ? ` day-${out.day.id}` : ''}`;
  view.innerHTML = out.html;
  document.title = `${TITLES[r.name]} · North Wales trip`;
  document.querySelectorAll('.tab').forEach((a) => {
    if (a.dataset.tab === r.name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  if (routeChanged) {
    lastHash = hash;
    const target =
      (r.name === 'plan' && r.b && document.getElementById(`stop-${r.b}`)) ||
      (r.name === 'places' && r.b && document.getElementById(`place-${r.b}`)) ||
      null;
    if (target) target.scrollIntoView({ block: 'start' });
    else {
      window.scrollTo(0, 0);
      view.scrollTop = 0;
    }
    // Keep the chosen filter chip visible in its sideways scrolling row.
    const chip = view.querySelector('.filter[aria-current="page"]');
    if (chip) chip.parentElement.scrollLeft = chip.offsetLeft - chip.parentElement.offsetLeft - 16;
    if (hasNavigated) view.focus({ preventScroll: true });
    hasNavigated = true;
  } else if (focusKey) {
    const again = view.querySelector(`[data-focus="${focusKey}"]`);
    if (again) again.focus({ preventScroll: true });
  }
}

/* ---------- Interaction ---------- */
view.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const id = el.dataset.id;
  const action = el.dataset.action;
  if (action === 'open') {
    // Open and close in place so the page doesn't jump or reload pictures.
    const panel = document.getElementById(`panel-${id}`);
    const stop = allStops.find((s) => s.id === id);
    if (!panel || !stop) return;
    const opening = !state.open.has(id);
    if (opening) {
      state.open.add(id);
      if (!panel.innerHTML) panel.innerHTML = panelContent(stop);
    } else state.open.delete(id);
    panel.hidden = !opening;
    el.setAttribute('aria-expanded', String(opening));
    return;
  }
  if (action === 'done') {
    if (state.done.has(id)) state.done.delete(id);
    else {
      state.done.add(id);
      state.lastTick = Date.now();
    }
    persist();
    render();
    return;
  }
  if (action === 'star') {
    if (state.starred.has(id)) state.starred.delete(id);
    else state.starred.add(id);
    persist();
    render();
    return;
  }
  if (action === 'reset') {
    // eslint-disable-next-line no-alert
    if (window.confirm('Clear every tick and star on this phone?')) {
      state.done.clear();
      state.starred.clear();
      state.lastTick = 0;
      persist();
      render();
    }
  }
});

window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) render();
});
// Keep the clock driven parts fresh (Today, Plan, Shops) without touching scroll or focus.
let lastMinute = now().minutes;
setInterval(() => {
  const m = now().minutes;
  if (m === lastMinute) return;
  lastMinute = m;
  if (['today', 'plan', 'shops'].includes(parseRoute().name)) render();
}, 15000);

/* ---------- Android app: back button and status bar ---------- */
if (isNative) {
  // Tab and in-app links replace the history entry, so Android's back button has one clear meaning.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    if (href !== location.hash) location.replace(href);
  });
  const App = registerPlugin('App');
  App.addListener('backButton', () => {
    if (parseRoute().name !== 'today') location.replace('#/today');
    else App.exitApp();
  });
}

/* ---------- Website: offline support ---------- */
if (!isNative && 'serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // A new version took over: reload once so the page and its files match.
    if (hadController && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

render();
