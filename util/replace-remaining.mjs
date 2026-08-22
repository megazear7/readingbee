import { appendFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const REPO = join(import.meta.dirname, "..");
const LOG = join(REPO, "util/replaced-images.txt");

const jobs = [
  ["fox", "src/static/letters/fox.png"],
  ["goat", "src/static/letters/goat.png"],
  ["hat", "src/static/letters/hat.png"],
  ["igloo", "src/static/letters/igloo.png"],
  ["jar", "src/static/letters/jar.png"],
  ["kite", "src/static/letters/kite.png"],
  ["lamp", "src/static/letters/lamp.png"],
  ["man", "src/static/letters/man.png"],
  ["nest", "src/static/letters/nest.png"],
  ["octopus", "src/static/letters/octopus.png"],
  ["pig", "src/static/letters/pig.png"],
  ["queen", "src/static/letters/queen.png"],
  ["rat", "src/static/letters/rat.png"],
  ["ship", "src/static/letters/ship.png"],
  ["snake", "src/static/letters/snake.png"],
  ["thumb", "src/static/letters/thumb.png"],
  ["tiger", "src/static/letters/tiger.png"],
  ["up", "src/static/letters/up.png"],
  ["van", "src/static/letters/van.png"],
  ["wagon", "src/static/letters/wagon.png"],
  ["whistle", "src/static/letters/whistle.png"],
  ["yoyo", "src/static/letters/yoyo.png"],
  ["zebra", "src/static/letters/zebra.png"],
  ["sticker", "src/static/shop/sticker.png"],
  ["hat", "src/static/shop/hat.png"],
  ["baseball bat", "src/static/shop/baseball-bat.png"],
  ["gloves", "src/static/shop/gloves.png"],
  ["football", "src/static/shop/football.png"],
  ["crayon", "src/static/shop/crayon.png"],
  ["balloon", "src/static/shop/balloon.png"],
  ["jump rope", "src/static/shop/jump-rope.png"],
  ["yo-yo", "src/static/shop/yoyo.png"],
  ["sword", "src/static/shop/sword.png"],
  ["book", "src/static/shop/book.png"],
  ["paintbrush", "src/static/shop/paintbrush.png"],
  ["scooter", "src/static/shop/scooter.png"],
  ["telescope", "src/static/shop/telescope.png"],
  ["magic wand", "src/static/shop/magic-wand.png"],
  ["soccer ball", "src/static/shop/soccer-ball.png"],
  ["backpack", "src/static/shop/backpack.png"],
  ["bicycle", "src/static/shop/bicycle.png"],
  ["skateboard", "src/static/shop/skateboard.png"],
  ["pet kitten", "src/static/shop/kitten.png"],
  ["pet puppy", "src/static/shop/puppy.png"],
  ["drum", "src/static/shop/drum.png"],
  ["guitar", "src/static/shop/guitar.png"],
  ["microphone", "src/static/shop/microphone.png"],
  ["camera", "src/static/shop/camera.png"],
  ["compass", "src/static/shop/compass.png"],
  ["treasure map", "src/static/shop/treasure-map.png"],
  ["pirate hat", "src/static/shop/pirate-hat.png"],
  ["shield", "src/static/shop/shield.png"],
  ["bow and arrow", "src/static/shop/bow.png"],
  ["robot toy", "src/static/shop/robot.png"],
  ["spaceship", "src/static/shop/spaceship.png"],
  ["rocket", "src/static/shop/rocket.png"],
  ["star", "src/static/shop/star.png"],
  ["moon lamp", "src/static/shop/moon-lamp.png"],
  ["rainbow", "src/static/shop/rainbow.png"],
  ["unicorn", "src/static/shop/unicorn.png"],
  ["fairy wings", "src/static/shop/fairy-wings.png"],
  ["crown", "src/static/shop/crown.png"],
  ["house", "src/static/shop/house.png"],
  ["treehouse", "src/static/shop/treehouse.png"],
  ["tent", "src/static/shop/tent.png"],
  ["campfire", "src/static/shop/campfire.png"],
  ["canoe", "src/static/shop/canoe.png"],
  ["surfboard", "src/static/shop/surfboard.png"],
  ["ice cream", "src/static/shop/ice-cream.png"],
  ["cake", "src/static/shop/cake.png"],
  ["pizza", "src/static/shop/pizza.png"],
  ["cookie", "src/static/shop/cookie.png"],
  ["honey pot", "src/static/shop/honey-pot.png"],
  ["flower bouquet", "src/static/shop/bouquet.png"],
  ["garden", "src/static/shop/garden.png"],
  ["butterfly", "src/static/shop/butterfly.png"],
  ["ladybug", "src/static/shop/ladybug.png"],
  ["goldfish", "src/static/shop/goldfish.png"],
  ["parrot", "src/static/shop/parrot.png"],
  ["bunny", "src/static/shop/bunny.png"],
  ["pony", "src/static/shop/pony.png"],
  ["owl", "src/static/shop/owl.png"],
  ["shop", "src/static/shop-front.png"],
];

const done = new Set(
  (await readFile(LOG, "utf8"))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
);

const remaining = jobs.filter(([, path]) => !done.has(path));
console.error(`${remaining.length} images remaining`);

const transport = new StdioClientTransport({
  command: "node",
  args: ["util/mcp-server.mjs"],
  cwd: REPO,
  stderr: "pipe",
});
transport.stderr?.on("data", (chunk) => process.stderr.write(chunk));

const client = new Client({ name: "readingbee-replace", version: "1.0.0" });
await client.connect(transport);

const failed = [];
for (const [description, destination] of remaining) {
  console.error(`generating ${destination} (${description})`);
  try {
    const result = await client.callTool({
      name: "make_image",
      arguments: { description, destination },
    });
    const text = result.content?.filter((part) => part.type === "text").map((part) => part.text).join("\n");
    if (result.isError) {
      console.error(`FAILED ${destination}: ${text}`);
      failed.push(destination);
      continue;
    }
    await appendFile(LOG, `${destination}\n`);
    console.error(text);
  } catch (error) {
    console.error(`FAILED ${destination}: ${error instanceof Error ? error.message : error}`);
    failed.push(destination);
  }
}

await client.close();
if (failed.length) {
  console.error(`failed ${failed.length}: ${failed.join(", ")}`);
  process.exitCode = 1;
} else {
  console.error("all remaining images replaced");
}
