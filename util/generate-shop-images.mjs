import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const REPO = join(import.meta.dirname, "..");
const CATALOG = join(REPO, "src/shared/shop-items.ts");
const SHARD = Number(process.env.SHOP_SHARD ?? 0);
const SHARDS = Math.max(1, Number(process.env.SHOP_SHARDS ?? 1));

const descriptions = {
  tv: "a colorful cartoon television set",
  "big-tv": "a huge colorful cartoon living-room television",
  radio: "a colorful cartoon radio",
  armor: "a colorful cartoon suit of knight armor",
  barn: "a colorful cartoon red barn",
  car: "a colorful cartoon car",
  "diamond-ring": "a colorful cartoon diamond ring",
  "pirate-ship": "a colorful cartoon pirate ship",
  airplane: "a colorful cartoon airplane",
  castle: "a colorful cartoon castle",
  "space-station": "a colorful cartoon space station",
  "vacation-island": "a tropical vacation island with palm trees, a sandy beach, and a small hut",
  rocket: "a colorful cartoon rocket ship",
  football: "a colorful cartoon American football, a brown oval leather ball with white laces",
  "golden-castle": "a colorful cartoon castle made of shining gold",
  "cloud-kingdom": "a colorful cartoon kingdom of palaces sitting on fluffy clouds",
  "luxury-yacht": "a colorful cartoon luxury yacht on blue water",
  "ice-kingdom": "a colorful cartoon ice kingdom with sparkling blue palaces",
  "jungle-palace": "a colorful cartoon palace hidden in a lush jungle",
  "space-colony": "a colorful cartoon space colony on a distant planet",
  "mountain-palace": "a colorful cartoon palace perched on a mountain peak",
  "coral-palace": "a colorful cartoon palace made of coral under the sea",
  "comet-ship": "a colorful cartoon spaceship riding a comet",
  "crystal-spire": "a colorful cartoon giant crystal tower",
  "sky-palace": "a colorful cartoon palace floating high in the sky",
  "moon-palace": "a colorful cartoon palace on the moon",
  "dragon-castle": "a colorful cartoon castle with a friendly dragon",
  "ocean-kingdom": "a colorful cartoon underwater ocean kingdom",
  "solar-sailer": "a colorful cartoon solar sailing spaceship",
  "phoenix-nest": "a colorful cartoon giant nest with a glowing phoenix",
  "hidden-kingdom": "a colorful cartoon secret kingdom behind a waterfall",
  "star-harbor": "a colorful cartoon harbor in space with docked starships",
  "titan-statue": "a colorful cartoon colossal friendly statue",
  "lost-city": "a colorful cartoon lost city in the jungle",
  "nebula-garden": "a colorful cartoon garden of stars and nebula flowers",
  "world-tree": "a colorful cartoon enormous world tree",
  "sky-ark": "a colorful cartoon giant ark flying through the clouds",
  "cosmic-garden": "a colorful cartoon garden among the planets",
  "eternity-gate": "a colorful cartoon glowing magical gateway",
  "dream-island": "a colorful cartoon island from a dream, with candy hills and a rainbow",
  "galaxy-core": "a colorful cartoon glowing galaxy core",
  "wonder-world": "a colorful cartoon whole world of wonders, tiny continents and sparkles",
  "star-palace": "a colorful cartoon palace made of stars",
  "endless-kingdom": "a colorful cartoon endless kingdom stretching to the horizon",
};

const parseCatalog = (source) => {
  const rows = [];
  const pattern = /\["([^"]+)", "([^"]+)", (\d+)\]/g;
  for (const match of source.matchAll(pattern)) {
    rows.push({ id: match[1], name: match[2], cost: Number(match[3]) });
  }
  return rows;
};

const FORCE = new Set(
  (process.env.SHOP_FORCE ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);
const catalog = parseCatalog(await readFile(CATALOG, "utf8"));
const jobs = catalog
  .map((item) => ({
    id: item.id,
    description: descriptions[item.id] ?? item.name.toLowerCase(),
    destination: `src/static/shop/${item.id}.png`,
  }))
  .filter((job, index) => index % SHARDS === SHARD && (FORCE.has(job.id) || !existsSync(join(REPO, job.destination))));

console.error(`shard ${SHARD}/${SHARDS}: ${jobs.length} images to generate`);

if (!jobs.length) {
  process.exit(0);
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["util/mcp-server.mjs"],
  cwd: REPO,
  stderr: "pipe",
});
transport.stderr?.on("data", (chunk) => process.stderr.write(chunk));

const client = new Client({ name: "readingbee-shop", version: "1.0.0" });
await client.connect(transport);

const failed = [];
for (const { description, destination } of jobs) {
  console.error(`generating ${destination} (${description})`);
  let lastError = "";
  let ok = false;
  for (let attempt = 0; attempt < 2 && !ok; attempt += 1) {
    try {
      const result = await client.callTool({
        name: "make_image",
        arguments: { description, destination },
      });
      const text = result.content
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n");
      if (result.isError) {
        lastError = text || "make_image error";
        console.error(`attempt ${attempt + 1} failed ${destination}: ${lastError}`);
        continue;
      }
      console.error(text);
      ok = true;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(`attempt ${attempt + 1} failed ${destination}: ${lastError}`);
    }
  }
  if (!ok) {
    failed.push(destination);
  }
}

await client.close();
if (failed.length) {
  console.error(`failed ${failed.length}: ${failed.join(", ")}`);
  process.exitCode = 1;
} else {
  console.error(`shard ${SHARD} complete`);
}
