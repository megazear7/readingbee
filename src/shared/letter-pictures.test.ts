import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LETTER_PICTURES, pictureFor } from "./letter-pictures.js";
import { ReadingText } from "./type.app.js";

const letter = (text: string, level = 1): ReadingText => ({
  id: `l-${text}`,
  text,
  level,
  kind: "letter",
});

describe("pictureFor", () => {
  it("has a picture for every single letter", () => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (const glyph of alphabet) {
      assert.equal(glyph in LETTER_PICTURES, true, glyph);
      assert.equal(pictureFor(letter(glyph)), LETTER_PICTURES[glyph]);
    }
    assert.equal(Object.keys(LETTER_PICTURES).length, 26);
  });

  it("does not invent pictures for letter pairs", () => {
    assert.equal(pictureFor(letter("qu", 3)), undefined);
    assert.equal(pictureFor(letter("sh", 4)), undefined);
  });

  it("hides pictures once the text is past the letter levels", () => {
    assert.equal(pictureFor({ id: "w", text: "a", level: 11, kind: "word" }), undefined);
    assert.equal(pictureFor(letter("a", 11)), undefined);
  });
});
