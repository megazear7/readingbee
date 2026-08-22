/* eslint-disable @typescript-eslint/explicit-function-return-type */
const CACHE_NAME = "reading-bee-v10";
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
  "/letters/apple.png",
  "/letters/boy.png",
  "/letters/cat.png",
  "/letters/chair.png",
  "/letters/dog.png",
  "/letters/egg.png",
  "/letters/fish.png",
  "/letters/fox.png",
  "/letters/goat.png",
  "/letters/hat.png",
  "/letters/igloo.png",
  "/letters/jar.png",
  "/letters/kite.png",
  "/letters/lamp.png",
  "/letters/man.png",
  "/letters/nest.png",
  "/letters/octopus.png",
  "/letters/pig.png",
  "/letters/queen.png",
  "/letters/rat.png",
  "/letters/ship.png",
  "/letters/snake.png",
  "/letters/thumb.png",
  "/letters/tiger.png",
  "/letters/up.png",
  "/letters/van.png",
  "/letters/wagon.png",
  "/letters/whistle.png",
  "/letters/yoyo.png",
  "/letters/zebra.png",
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
  "/shop-front.png",
  "/shop/backpack.png",
  "/shop/balloon.png",
  "/shop/baseball-bat.png",
  "/shop/bicycle.png",
  "/shop/book.png",
  "/shop/bouquet.png",
  "/shop/bow.png",
  "/shop/bunny.png",
  "/shop/butterfly.png",
  "/shop/cake.png",
  "/shop/camera.png",
  "/shop/campfire.png",
  "/shop/canoe.png",
  "/shop/compass.png",
  "/shop/cookie.png",
  "/shop/crayon.png",
  "/shop/crown.png",
  "/shop/drum.png",
  "/shop/fairy-wings.png",
  "/shop/football.png",
  "/shop/garden.png",
  "/shop/gloves.png",
  "/shop/goldfish.png",
  "/shop/guitar.png",
  "/shop/hat.png",
  "/shop/honey-pot.png",
  "/shop/house.png",
  "/shop/ice-cream.png",
  "/shop/jump-rope.png",
  "/shop/kitten.png",
  "/shop/ladybug.png",
  "/shop/magic-wand.png",
  "/shop/microphone.png",
  "/shop/moon-lamp.png",
  "/shop/owl.png",
  "/shop/paintbrush.png",
  "/shop/parrot.png",
  "/shop/pirate-hat.png",
  "/shop/pizza.png",
  "/shop/pony.png",
  "/shop/puppy.png",
  "/shop/rainbow.png",
  "/shop/robot.png",
  "/shop/rocket.png",
  "/shop/scooter.png",
  "/shop/shield.png",
  "/shop/skateboard.png",
  "/shop/soccer-ball.png",
  "/shop/spaceship.png",
  "/shop/star.png",
  "/shop/sticker.png",
  "/shop/surfboard.png",
  "/shop/sword.png",
  "/shop/telescope.png",
  "/shop/tent.png",
  "/shop/treasure-map.png",
  "/shop/treehouse.png",
  "/shop/unicorn.png",
  "/shop/yoyo.png",
  "/sounds/Coin01.mp3",
  "/sounds/Coin02.mp3",
  "/sounds/Coin03.mp3",
  "/sounds/Coin04.mp3",
  "/sounds/Coin05.mp3",
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
