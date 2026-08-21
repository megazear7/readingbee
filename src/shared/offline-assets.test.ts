import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { LETTER_PICTURES } from "./letter-pictures.js";

const staticDir = fileURLToPath(new URL("../../src/static", import.meta.url));
const swSource = readFileSync(join(staticDir, "sw.js"), "utf8");

const listedFiles = (dir: string): string[] => {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return listedFiles(full);
    }
    return [full];
  });
};

const parseAssets = (source: string): string[] => {
  const block = source.match(/const ASSETS = \[([\s\S]*?)\];/);
  assert.ok(block, "service worker is missing ASSETS");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
};

describe("offline precache", () => {
  const assets = parseAssets(swSource);

  it("precaches every letter picture", () => {
    for (const src of Object.values(LETTER_PICTURES)) {
      assert.equal(assets.includes(src), true, src);
    }
  });

  it("precaches every static file the app ships", () => {
    const skip = new Set(["_redirects", ".DS_Store"]);
    for (const file of listedFiles(staticDir)) {
      const name = relative(staticDir, file).replaceAll("\\", "/");
      if (skip.has(name) || name.endsWith(".DS_Store")) {
        continue;
      }
      assert.equal(assets.includes(`/${name}`), true, name);
    }
  });

  it("serves cached files first so images do not wait on the network", () => {
    assert.match(swSource, /if \(cached\) \{\s*return cached;/);
    assert.match(swSource, /cache\.match\("\/index\.html"\)/);
    assert.equal(assets.includes("/bundle.js"), true);
    assert.equal(assets.includes("/index.html"), true);
  });
});
