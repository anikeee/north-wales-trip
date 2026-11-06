// Sanity checks for the trip data and the offline file list.
// Usage: node scripts/check-data.mjs [file-with-one-url-per-line]
// The optional file is the list of links in the original PDF (pdfinfo -url); every one must be in the data.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { trip, days, shops, places, placeGroups, tips } from '../web/js/data.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const web = join(root, 'web');
const problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

// Shape of the plan, as printed in the PDF.
check(days.length === 4, `expected 4 days, got ${days.length}`);
check(JSON.stringify(days.map((d) => d.stops.length)) === '[4,10,7,6]', `stops per day ${days.map((d) => d.stops.length)}`);
check(shops.length === 7, `expected 7 shops, got ${shops.length}`);
check(places.length === 28, `expected 28 places, got ${places.length}`);
check(places.filter((p) => p.group === 'near').length === 9, 'expected 9 places within 30 minutes');
check(places.filter((p) => p.group === 'far').length === 19, 'expected 19 places further out');
check(tips.length === 6, `expected 6 tips, got ${tips.length}`);
check(placeGroups.length === 2, 'expected 2 place groups');

// Links between things, ids, times.
const stopIds = new Set();
const placeIds = new Set(places.map((p) => p.id));
const dayIds = new Set(days.map((d) => d.id));
for (const day of days) {
  let prev = -1;
  for (const s of day.stops) {
    check(!stopIds.has(s.id), `duplicate stop id ${s.id}`);
    stopIds.add(s.id);
    check(s.id.startsWith(day.id), `stop ${s.id} is not under ${day.id}`);
    const [h, m] = s.time.split(':').map(Number);
    const mins = h * 60 + m;
    check(mins > prev, `stop ${s.id} is out of time order`);
    prev = mins;
    if (s.place) check(placeIds.has(s.place), `stop ${s.id} points at missing place ${s.place}`);
    for (const d of s.details || []) {
      check(['parking', 'food', 'toilets'].includes(d.kind), `stop ${s.id} has unknown detail ${d.kind}`);
      check(d.items.length > 0, `stop ${s.id} has an empty ${d.kind} row`);
    }
  }
}
for (const p of places) {
  if (p.day) check(dayIds.has(p.day), `place ${p.id} points at missing day ${p.day}`);
  check(existsSync(join(web, 'img/places', `${p.id}.webp`)), `missing picture for ${p.id}`);
}
const mins = places.map((p) => p.mins);
check(mins.every((m, i) => i === 0 || m >= mins[i - 1]), 'places are not closest first');

// Every link goes to Google Maps.
const urls = [trip.stay.maps, ...shops.map((s) => s.maps), ...places.map((p) => p.maps)];
for (const u of urls) check(u.startsWith('https://www.google.com/maps/'), `odd link ${u}`);

// Optional: every link from the PDF is present, exactly.
const pdfUrlFile = process.argv[2];
if (pdfUrlFile) {
  const pdfUrls = readFileSync(pdfUrlFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
  const have = new Set(urls);
  for (const u of pdfUrls) check(have.has(u), `PDF link missing from data: ${u}`);
  check(pdfUrls.length === urls.length, `PDF has ${pdfUrls.length} links, data has ${urls.length}`);
  // Place links must be in the same order as the PDF cards.
  const pdfPlaceUrls = pdfUrls.filter((u) => u.includes('Llandudno%20LL30%203PT&destination='));
  check(JSON.stringify(pdfPlaceUrls) === JSON.stringify(places.map((p) => p.maps)), 'place links are not in PDF order');
}

// The service worker caches every file the site needs, and nothing that doesn't exist.
const sw = readFileSync(join(web, 'sw.js'), 'utf8');
const placeList = [...sw.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]).filter((id) => placeIds.has(id));
const listed = new Set([
  ...[...sw.matchAll(/'([^'\n]+\.(?:html|css|js|webmanifest|woff2|svg|png|webp))'/g)].map((m) => m[1]),
  ...placeList.map((id) => `img/places/${id}.webp`),
]);
check(placeList.length === 28, `service worker lists ${placeList.length} place pictures`);
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [relative(web, p)];
  });
const files = walk(web).filter((f) => !['sw.js', 'fonts/OFL.txt'].includes(f) && !f.endsWith('.DS_Store'));
for (const f of files) check(listed.has(f), `service worker does not cache ${f}`);
for (const f of listed) check(existsSync(join(web, f)), `service worker lists missing file ${f}`);

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`✓ data ok: ${days.length} days, ${stopIds.size} stops, ${shops.length} shops, ${places.length} places, ${tips.length} tips; ${files.length} web files cached${pdfUrlFile ? '; all PDF links present in order' : ''}`);
