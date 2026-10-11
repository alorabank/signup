// Alora Bank service worker — app shell caching for the installed PWA.
// Static assets are cached; API calls and navigations always hit the network first.

var CACHE = 'alora-bank-v3';
var SHELL = [
  '/signup/',
  '/signup/index.html',
  '/signup/login.html',
  '/signup/dashboard.html',
  '/signup/admin.html',
  '/signup/invest.html',
  '/signup/manifest.webmanifest',
  '/signup/icon.svg',
  '/signup/icon-maskable.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () {})
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  // Only handle same-origin GET requests; API calls go straight to the network.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // App code (pages, JS, CSS): network first so updates show up immediately,
  // cache as offline fallback.
  var isCode = e.request.mode === 'navigate' ||
    url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  if (isCode) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          if (hit) return hit;
          if (e.request.mode === 'navigate') return caches.match('/signup/index.html');
          return new Response('', { status: 504 });
        });
      })
    );
    return;
  }

  // Static assets (icons, manifest): cache first, then network.
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    })
  );
});
