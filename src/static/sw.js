const CACHE_NAME = "reading-bee-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/bundle.js",
  "/app.css",
  "/manifest.json",
  "/sw.js",
  "/fonts/lexend-500.woff2",
  "/fonts/nunito-400.woff2",
  "/fonts/nunito-700.woff2",
  "/logo/favicon.png",
  "/logo/logo-16x16.png",
  "/logo/logo-24x24.png",
  "/logo/logo-32x32.png",
  "/logo/logo-64x64.png",
  "/logo/logo-128x128.png",
  "/logo/logo-192x192.png",
  "/logo/logo-256x256.png",
  "/logo/logo-512x512.png",
  "/logo/logo-original.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Response.error();
        });
      }),
  );
});
