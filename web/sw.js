// Offline support for the website (the Android app already has every file inside it).
// Bump VERSION whenever anything in web/ changes, so phones drop the old copy.
const VERSION = 'nw-trip-v1';

const PLACES = [
  'llandudno-pier', 'great-orme', 'snowsports', 'conwy-castle', 'welsh-mountain-zoo', 'bodnant-garden',
  'tu-hwnt-ir-bont', 'aber-falls', 'bangor-garth-pier', 'betws-y-coed', 'llyn-crafnant', 'llanfairpwll',
  'beaumaris', 'caernarfon-castle', 'llanberis', 'capel-curig', 'llyn-ogwen', 'betws-garmon',
  'newborough-llanddwyn', 'beddgelert', 'corwen-ty-nant', 'portmeirion', 'south-stack', 'criccieth',
  'croesor', 'pontcysyllte', 'nant-mill', 'harlech-castle',
];

const ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/data.js',
  'js/vendor/capacitor-core.js',
  'manifest.webmanifest',
  'fonts/archivo-latin-wdth-normal.woff2',
  'fonts/archivo-latin-ext-wdth-normal.woff2',
  'img/qr.svg',
  'img/icons/favicon.svg',
  'img/icons/icon.svg',
  'img/icons/icon-192.png',
  'img/icons/icon-512.png',
  'img/icons/maskable-512.png',
  'img/icons/apple-touch-icon.png',
  ...PLACES.map((id) => `img/places/${id}.webp`),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // The page itself: try the network so a new version shows up, fall back to the saved copy.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put('index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('index.html')),
    );
    return;
  }

  // Everything else: saved copy first (fast and works with no signal), network as a fallback.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
