const CACHE_NAME = "reading-bee-v5";
const ASSETS = [
  "/",
  "/index.html",
  "/bundle.js",
  "/app.css",
  "/manifest.json",
  "/sw.js",
  "/letters/apple.webp",
  "/letters/ball.webp",
  "/letters/cat.webp",
  "/letters/dog.webp",
  "/letters/egg.webp",
  "/letters/fish.webp",
  "/letters/grapes.webp",
  "/letters/hat.webp",
  "/letters/iguana.webp",
  "/letters/jam.webp",
  "/letters/kite.webp",
  "/letters/leaf.webp",
  "/letters/mouse.webp",
  "/letters/nest.webp",
  "/letters/orange.webp",
  "/letters/pig.webp",
  "/letters/quilt.webp",
  "/letters/rabbit.webp",
  "/letters/sun.webp",
  "/letters/tree.webp",
  "/letters/umbrella.webp",
  "/letters/violin.webp",
  "/letters/whale.webp",
  "/letters/xray.webp",
  "/letters/yoyo.webp",
  "/letters/zebra.webp",
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
