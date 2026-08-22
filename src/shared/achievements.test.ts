import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProfile } from "./algorithm.js";
import { ACHIEVEMENTS, syncAchievements } from "./achievements.js";

describe("ACHIEVEMENTS", () => {
  it("has 21 medals in seven families of three", () => {
    assert.equal(ACHIEVEMENTS.length, 21);
    const families = ACHIEVEMENTS.map((item) => item.family);
    assert.equal(new Set(families).size, 7);
    for (const family of new Set(families)) {
      assert.equal(ACHIEVEMENTS.filter((item) => item.family === family).length, 3);
    }
  });

  it("unlocks streak, shop, and bank flavors from progress", () => {
    const base = createProfile("Ava", "letters", []);
    const streaked = syncAchievements({ ...base, maxCorrectStreak: 10 });
    assert.equal(streaked.achievements.includes("streak-5"), true);
    assert.equal(streaked.achievements.includes("streak-10"), true);
    assert.equal(streaked.achievements.includes("streak-20"), false);

    const shopper = syncAchievements({ ...base, inventory: ["sticker", "hat", "balloon"] });
    assert.equal(shopper.achievements.includes("shop-3"), true);
    assert.equal(shopper.achievements.includes("shop-10"), false);

    const saved = syncAchievements({ ...base, coins: 50, peakCoins: 50 });
    assert.equal(saved.achievements.includes("bank-20"), true);
    assert.equal(saved.achievements.includes("bank-50"), true);
    assert.equal(saved.achievements.includes("bank-100"), false);
  });

  it("keeps a bank medal after coins are spent", () => {
    const base = createProfile("Ava", "letters", []);
    const rich = syncAchievements({ ...base, coins: 100, peakCoins: 100 });
    const spent = syncAchievements({ ...rich, coins: 4 });
    assert.equal(spent.peakCoins, 100);
    assert.equal(spent.achievements.includes("bank-100"), true);
  });

  it("marks level 5 for students who start in words", () => {
    const profile = syncAchievements(createProfile("Ava", "words", []));
    assert.equal(profile.achievements.includes("level-5"), true);
    assert.equal(profile.achievements.includes("level-20"), false);
  });
});
