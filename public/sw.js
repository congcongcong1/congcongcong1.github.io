// PWA Service Worker：预缓存核心页面，离线可访问
// 策略：HTML 网络优先（永远拿最新，离线才回退缓存）；静态资源缓存优先（带 hash，安全）
const CACHE = 'zicongluo-v10';
const PRECACHE = [
  '/',
  '/notes/',
  '/projects/',
  '/search/',
  '/site-index.json',
  '/about/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/avatar.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  // 跳过带 hash 的锚点请求
  if (req.url.includes('#')) return;

  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // HTML：网络优先，成功后顺手更新缓存，离线才用缓存兜底
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('/'))
      )
    );
    return;
  }

  // 静态资源（JS/CSS/图片）：stale-while-revalidate——
  // 先回缓存立刻显示（秒开），同时后台拉新副本，下次访问自动换上
  e.respondWith(
    caches.match(req).then((hit) => {
      const update = fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => hit);
      // 有缓存：立刻显示旧图，后台默默换新
      if (hit) {
        update;
        return hit;
      }
      // 无缓存：等网络，顺便写入缓存
      return update.then((res) => res || caches.match('/'));
    })
  );
});
