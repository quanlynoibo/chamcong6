/* Service worker cho app Chấm Công GPS
   - Cache "vỏ" app (index + font + SDK) để mở nhanh và mở được khi offline.
   - KHÔNG cache dữ liệu Firebase (phải luôn lấy mới từ mạng). */
const CACHE = 'chamcong-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Dữ liệu Firebase Realtime Database -> luôn đi mạng, không đụng cache
  if (url.includes('firebaseio.com') || url.includes('firebasedatabase.app') || url.includes('google.com/identitytoolkit')) {
    return; // để trình duyệt xử lý mặc định (network)
  }
  // Vỏ app: cache-first, có mạng thì cập nhật ngầm
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
