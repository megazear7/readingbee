import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { SHOP_ITEMS } from "./shop-items.js";

const staticDir = fileURLToPath(new URL("../../src/static", import.meta.url));

describe("SHOP_ITEMS", () => {
  it("has unique rewards with matching image files", () => {
    const ids = new Set(SHOP_ITEMS.map((item) => item.id));
    assert.equal(ids.size, SHOP_ITEMS.length);
    assert.equal(SHOP_ITEMS.find((item) => item.name === "Hat")?.cost, 2);
    assert.equal(SHOP_ITEMS.find((item) => item.name === "Sword")?.cost, 10);
    assert.equal(SHOP_ITEMS.find((item) => item.name === "House")?.cost, 40);
    for (const item of SHOP_ITEMS) {
      const file = join(staticDir, item.image.replace(/^\//, ""));
      assert.equal(existsSync(file), true, item.image);
    }
  });
});
