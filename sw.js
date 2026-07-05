const CACHE = 'gymos-v2';
const urlsToCache = [
  '/',
  '/login.html',
  '/dashboard.html',
  '/members.html',
  '/member.html',
  '/add-member.html',
  '/edit-member.html',
  '/plans.html',
  '/services.html',
  '/revenue.html',
  '/reports.html',
  '/settings.html',
  '/scan.html',
  '/js/utils.js',
  '/js/supabase.js',
  '/js/i18n.js',
  '/js/ui.js',
  '/js/auth.js',
  '/css/style.css',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(res =>
      res || fetch(e.request).then(netRes => {
        if (netRes.ok && netRes.type === 'basic') {
          const clone = netRes.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return netRes;
      })
    )
  );
});
