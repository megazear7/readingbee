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
};

const parseCatalog = (source) => {
  const rows = [];
  const pattern = /\["([^"]+)", "([^"]+)", (\d+)\]/g;
  for (const match of source.matchAll(pattern)) {
    rows.push({ id: match[1], name: match[2], cost: Number(match[3]) });
  }
  return rows;
};

const catalog = parseCatalog(await readFile(CATALOG, "utf8"));
const jobs = catalog
  .map((item) => ({
    description: descriptions[item.id] ?? item.name.toLowerCase(),
    destination: `src/static/shop/${item.id}.png`,
  }))
  .filter((job, index) => index % SHARDS === SHARD && !existsSync(join(REPO, job.destination)));

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
