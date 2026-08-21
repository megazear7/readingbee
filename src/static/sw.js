/* eslint-disable @typescript-eslint/explicit-function-return-type */
const CACHE_NAME = "reading-bee-v9";
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
  "/letters/apple.webp",
  "/letters/boy.webp",
  "/letters/cat.webp",
  "/letters/chair.webp",
  "/letters/dog.webp",
  "/letters/egg.webp",
  "/letters/fish.webp",
  "/letters/fox.webp",
  "/letters/goat.webp",
  "/letters/hat.webp",
  "/letters/igloo.webp",
  "/letters/jar.webp",
  "/letters/kite.webp",
  "/letters/lamp.webp",
  "/letters/man.webp",
  "/letters/nest.webp",
  "/letters/octopus.webp",
  "/letters/pig.webp",
  "/letters/queen.webp",
  "/letters/rat.webp",
  "/letters/ship.webp",
  "/letters/snake.webp",
  "/letters/thumb.webp",
  "/letters/tiger.webp",
  "/letters/up.webp",
  "/letters/van.webp",
  "/letters/wagon.webp",
  "/letters/whistle.webp",
  "/letters/yoyo.webp",
  "/letters/zebra.webp",
  "/logo/favicon.png",
  "/logo/logo-128x128.png",
  "/logo/logo-16x16.png",
  "/logo/logo-192x192.png",
  "/logo/logo-24x24.png",
  "/logo/logo-256x256.png",
  "/logo/logo-32x32.png",
  "/logo/logo-512x512.png",
  "/logo/logo-64x64.png",
  "/logo/logo-original.png",
  "/shop/backpack.webp",
  "/shop/balloon.webp",
  "/shop/baseball-bat.webp",
  "/shop/bicycle.webp",
  "/shop/book.webp",
  "/shop/bouquet.webp",
  "/shop/bow.webp",
  "/shop/bunny.webp",
  "/shop/butterfly.webp",
  "/shop/cake.webp",
  "/shop/camera.webp",
  "/shop/campfire.webp",
  "/shop/canoe.webp",
  "/shop/compass.webp",
  "/shop/cookie.webp",
  "/shop/crayon.webp",
  "/shop/crown.webp",
  "/shop/drum.webp",
  "/shop/fairy-wings.webp",
  "/shop/football.webp",
  "/shop/garden.webp",
  "/shop/gloves.webp",
  "/shop/goldfish.webp",
  "/shop/guitar.webp",
  "/shop/hat.webp",
  "/shop/honey-pot.webp",
  "/shop/house.webp",
  "/shop/ice-cream.webp",
  "/shop/jump-rope.webp",
  "/shop/kitten.webp",
  "/shop/ladybug.webp",
  "/shop/magic-wand.webp",
  "/shop/microphone.webp",
  "/shop/moon-lamp.webp",
  "/shop/owl.webp",
  "/shop/paintbrush.webp",
  "/shop/parrot.webp",
  "/shop/pirate-hat.webp",
  "/shop/pizza.webp",
  "/shop/pony.webp",
  "/shop/puppy.webp",
  "/shop/rainbow.webp",
  "/shop/robot.webp",
  "/shop/rocket.webp",
  "/shop/scooter.webp",
  "/shop/shield.webp",
  "/shop/skateboard.webp",
  "/shop/soccer-ball.webp",
  "/shop/spaceship.webp",
  "/shop/star.webp",
  "/shop/sticker.webp",
  "/shop/surfboard.webp",
  "/shop/sword.webp",
  "/shop/telescope.webp",
  "/shop/tent.webp",
  "/shop/treasure-map.webp",
  "/shop/treehouse.webp",
  "/shop/unicorn.webp",
  "/shop/yoyo.webp",
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
