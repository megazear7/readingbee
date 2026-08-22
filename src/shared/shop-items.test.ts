import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { hiddenShopRow, SHOP_ITEMS, shopTeaseCount, visibleShopCount } from "./shop-items.js";

const staticDir = fileURLToPath(new URL("../../src/static", import.meta.url));

describe("SHOP_ITEMS", () => {
  it("has three unique rewards at every cost from 1 to 100", () => {
    const ids = new Set(SHOP_ITEMS.map((item) => item.id));
    assert.equal(SHOP_ITEMS.length, 300);
    assert.equal(ids.size, 300);
    assert.equal(SHOP_ITEMS.find((item) => item.name === "Hat")?.cost, 2);
    assert.equal(SHOP_ITEMS.find((item) => item.name === "Sword")?.cost, 20);
    assert.equal(SHOP_ITEMS.find((item) => item.name === "House")?.cost, 80);
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 1).map((item) => item.id),
      ["yoyo", "sticker", "balloon"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 5).map((item) => item.id),
      ["gloves", "bunny", "surfboard"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 10).map((item) => item.id),
      ["radio", "tent", "kitten"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 15).map((item) => item.id),
      ["puppy", "shield", "parrot"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 20).map((item) => item.id),
      ["tv", "pony", "sword"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 30).map((item) => item.id),
      ["armor", "magic-wand", "barn"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 40).map((item) => item.id),
      ["car", "treehouse", "big-tv"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 60).map((item) => item.id),
      ["diamond-ring", "pirate-ship", "airplane"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 80).map((item) => item.id),
      ["house", "crown", "rocket"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 100).map((item) => item.id),
      ["castle", "space-station", "vacation-island"],
    );
    for (let cost = 1; cost <= 100; cost += 1) {
      const row = SHOP_ITEMS.filter((item) => item.cost === cost);
      assert.equal(row.length, 3, `cost ${cost}`);
    }
    for (let index = 0; index < SHOP_ITEMS.length; index += 3) {
      const row = SHOP_ITEMS.slice(index, index + 3);
      assert.equal(row[0].cost, row[1].cost);
      assert.equal(row[1].cost, row[2].cost);
    }
    for (const item of SHOP_ITEMS) {
      const file = join(staticDir, item.image.replace(/^\//, ""));
      assert.equal(existsSync(file), true, item.image);
    }
  });

  it("unlocks rows from peak coins on hand plus two extra", () => {
    assert.equal(visibleShopCount(0), 6);
    assert.equal(visibleShopCount(1), 9);
    assert.equal(visibleShopCount(5), 21);
    assert.equal(visibleShopCount(98), 300);
    assert.equal(visibleShopCount(200), 300);
  });

  it("teases two light-blur rows and two heavier-blur rows, then hides the rest", () => {
    assert.equal(shopTeaseCount(0), 18);
    assert.equal(hiddenShopRow(5, 6), null);
    assert.equal(hiddenShopRow(6, 6), 0);
    assert.equal(hiddenShopRow(11, 6), 1);
    assert.equal(hiddenShopRow(12, 6), 2);
    assert.equal(hiddenShopRow(17, 6), 3);
    assert.equal(hiddenShopRow(18, 6), null);
  });
});
