import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  hiddenShopRow,
  nextShopSpendUnlock,
  SHOP_ITEMS,
  shopTeaseCount,
  shopUnlockMessage,
  visibleShopCount,
} from "./shop-items.js";

const staticDir = fileURLToPath(new URL("../../src/static", import.meta.url));

describe("SHOP_ITEMS", () => {
  it("has three unique rewards at every cost from 1 to 100, then every ten from 110 to 200", () => {
    const ids = new Set(SHOP_ITEMS.map((item) => item.id));
    assert.equal(SHOP_ITEMS.length, 330);
    assert.equal(ids.size, 330);
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
    for (let cost = 110; cost <= 200; cost += 10) {
      const row = SHOP_ITEMS.filter((item) => item.cost === cost);
      assert.equal(row.length, 3, `cost ${cost}`);
    }
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 110).map((item) => item.id),
      ["golden-castle", "cloud-kingdom", "luxury-yacht"],
    );
    assert.deepEqual(
      SHOP_ITEMS.filter((item) => item.cost === 200).map((item) => item.id),
      ["wonder-world", "star-palace", "endless-kingdom"],
    );
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

  it("unlocks cost 10+ only after spending 10 coins, 20+ after 20, and so on", () => {
    assert.equal(visibleShopCount(0), 27);
    assert.equal(visibleShopCount(9), 27);
    assert.equal(visibleShopCount(10), 57);
    assert.equal(visibleShopCount(19), 57);
    assert.equal(visibleShopCount(20), 87);
    assert.equal(visibleShopCount(99), 297);
    assert.equal(visibleShopCount(100), 303);
    assert.equal(visibleShopCount(109), 303);
    assert.equal(visibleShopCount(110), 306);
    assert.equal(visibleShopCount(190), 330);
    assert.equal(nextShopSpendUnlock(0), 10);
    assert.equal(nextShopSpendUnlock(15), 5);
    assert.equal(nextShopSpendUnlock(100), 10);
    assert.equal(nextShopSpendUnlock(190), null);
    assert.equal(shopUnlockMessage(7), "Spend 3 more coins to unlock more items");
  });

  it("shows four increasingly hidden preview rows, then nothing else", () => {
    assert.equal(shopTeaseCount(0), 39);
    assert.equal(hiddenShopRow(26, 27), null);
    assert.equal(hiddenShopRow(27, 27), 0);
    assert.equal(hiddenShopRow(29, 27), 0);
    assert.equal(hiddenShopRow(30, 27), 1);
    assert.equal(hiddenShopRow(33, 27), 2);
    assert.equal(hiddenShopRow(38, 27), 3);
    assert.equal(hiddenShopRow(39, 27), null);
  });
});
