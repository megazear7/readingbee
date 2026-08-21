/* eslint-disable @typescript-eslint/explicit-function-return-type */
const CACHE_NAME = "reading-bee-v6";
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

const precache = async () => {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    ASSETS.map(async (asset) => {
      const response = await fetch(asset, { cache: "reload" });
      if (!response.ok) {
        throw new Error(`Failed to precache ${asset}: ${response.status}`);
      }
      await cache.put(asset, response);
    }),
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    precache().then(() => {
      return self.skipWaiting();
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

const matchCached = async (cache, request, url) => {
  return (
    (await cache.match(url.pathname)) ||
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match(url.pathname + url.search))
  );
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      if (event.request.mode === "navigate") {
        const page = (await cache.match("/index.html")) || (await cache.match("/"));
        if (page) {
          return page;
        }
      }

      const cached = await matchCached(cache, event.request, url);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          await cache.put(url.pathname, response.clone());
        }
        return response;
      } catch {
        if (event.request.mode === "navigate") {
          return (await cache.match("/index.html")) || Response.error();
        }
        return Response.error();
      }
    }),
  );
});
