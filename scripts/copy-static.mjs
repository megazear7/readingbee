import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "src/static");
const to = resolve(root, "dist");
const skip = new Set(["_redirects", ".DS_Store"]);
const shell = ["/", "/index.html", "/bundle.js", "/app.css", "/manifest.json", "/sw.js"];

const listedFiles = async (dir, base = dir) => {
  const names = await readdir(dir);
  const out = [];
  for (const name of names) {
    if (name === ".DS_Store") continue;
    const full = join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) {
      out.push(...(await listedFiles(full, base)));
      continue;
    }
    const rel = relative(base, full).replaceAll("\\", "/");
    if (skip.has(rel) || rel.endsWith(".DS_Store")) continue;
    out.push(`/${rel}`);
  }
  return out.sort((left, right) => left.localeCompare(right));
};

const syncServiceWorkerAssets = async () => {
  const swPath = join(from, "sw.js");
  const source = await readFile(swPath, "utf8");
  const files = await listedFiles(from);
  const rest = files.filter((path) => !shell.includes(path));
  const assets = [...shell, ...rest];
  const block = `const ASSETS = [\n${assets.map((path) => `  "${path}",`).join("\n")}\n];`;
  if (!/const ASSETS = \[[\s\S]*?\];/.test(source)) {
    throw new Error("service worker is missing ASSETS");
  }
  const next = source.replace(/const ASSETS = \[[\s\S]*?\];/, block);
  if (next !== source) {
    await writeFile(swPath, next);
  }
  return assets;
};

const removeStale = async (subdir) => {
  const destDir = join(to, subdir);
  const srcDir = join(from, subdir);
  if (!existsSync(destDir)) return;
  for (const name of await readdir(destDir)) {
    if (name === ".DS_Store" || !existsSync(join(srcDir, name))) {
      await rm(join(destDir, name), { recursive: true, force: true });
    }
  }
};

const fileForAsset = (asset) => {
  if (asset === "/" || asset === "/index.html") return join(from, "index.html");
  if (asset === "/bundle.js") return join(to, "bundle.js");
  if (asset === "/sw.js") return join(from, "sw.js");
  return join(from, asset.replace(/^\//, ""));
};

const stampCacheName = async (assets) => {
  const hash = createHash("sha256");
  const seen = new Set();
  for (const asset of assets) {
    const file = fileForAsset(asset);
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    hash.update(asset);
    hash.update(await readFile(file));
  }
  const id = hash.digest("hex").slice(0, 12);
  const dest = join(to, "sw.js");
  const source = await readFile(dest, "utf8");
  await writeFile(dest, source.replace(/const CACHE_NAME = "[^"]+"/, `const CACHE_NAME = "reading-bee-${id}"`));
  return id;
};

const assets = await syncServiceWorkerAssets();
await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });
await Promise.all(["letters", "shop", "logo", "fonts"].map(removeStale));
const cacheId = await stampCacheName(assets);
console.log(
  `Copied static assets to dist/ (${assets.filter((path) => /\.(webp|png|jpe?g|gif|svg)$/i.test(path)).length} images precached, cache reading-bee-${cacheId})`,
);
