import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { COLOR_PAIRS, profileInitial, readableTextColor } from "./colors.js";

describe("readableTextColor", () => {
  it("picks dark text on the light cream pair", () => {
    const pair = COLOR_PAIRS[0]!;
    assert.equal(readableTextColor(pair.primary, pair.secondary), "#1A1408");
  });

  it("picks light text on dark colors", () => {
    assert.equal(readableTextColor("#1A1408", "#2C261F"), "#F4EAD5");
  });

  it("returns a color for every profile pair", () => {
    for (const pair of COLOR_PAIRS) {
      const color = readableTextColor(pair.primary, pair.secondary);
      assert.ok(color === "#1A1408" || color === "#F4EAD5");
    }
  });
});

describe("COLOR_PAIRS", () => {
  it("fills a 6-column grid with no leftover cells", () => {
    assert.equal(COLOR_PAIRS.length, 24);
    assert.equal(COLOR_PAIRS.length % 6, 0);
  });
});

describe("profileInitial", () => {
  it("uses the first letter, uppercased", () => {
    assert.equal(profileInitial("ava"), "A");
    assert.equal(profileInitial("  max"), "M");
  });
});
