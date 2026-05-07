const CACHE_NAME = "todo-app-v2";

// Service Workerが置かれている場所を基準にパスを解決（ローカル・GitHub Pages両対応）
const BASE = self.location.pathname.replace("/sw.js", "");
const ASSETS = [
  BASE + "/",
  BASE + "/index.html",
  BASE + "/manifest.json",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url =>
          fetch(url).then(res => cache.put(url, res)).catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // html以外のナビゲーションは無視
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 正常なレスポンスはキャッシュに追加
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // オフライン時はindex.htmlにフォールバック
        return caches.match(BASE + "/index.html");
      });
    })
  );
});
