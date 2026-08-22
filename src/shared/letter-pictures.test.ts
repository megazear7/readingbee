import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyResult, createProfile } from "./algorithm.js";
import { corpus } from "./corpus.js";
import { LETTER_PICTURES, PICTURE_HIDE_STREAK, PICTURE_REFRESH_STREAK, pictureFor } from "./letter-pictures.js";
import { ReadingText } from "./type.app.js";

const letter = (text: string, level = 1): ReadingText => ({
  id: `l-${text}`,
  text,
  level,
  kind: "letter",
});

const mark = (profile: ReturnType<typeof createProfile>, text: ReadingText, result: "right" | "wrong" | "wayTooEasy") =>
  applyResult(profile, text, result);

describe("pictureFor", () => {
  it("has a picture for every single letter except isolated q", () => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (const glyph of alphabet) {
      if (glyph === "q") {
        assert.equal(glyph in LETTER_PICTURES, false, glyph);
        assert.equal(pictureFor(letter(glyph)), undefined);
        continue;
      }
      assert.equal(glyph in LETTER_PICTURES, true, glyph);
      assert.equal(pictureFor(letter(glyph)), LETTER_PICTURES[glyph]);
    }
  });

  it("has pictures for qu, wh, th, ch, and sh", () => {
    assert.equal(pictureFor(letter("qu", 3)), "/letters/queen.png");
    assert.equal(pictureFor(letter("wh", 4)), "/letters/whistle.png");
    assert.equal(pictureFor(letter("th", 4)), "/letters/thumb.png");
    assert.equal(pictureFor(letter("ch", 4)), "/letters/chair.png");
    assert.equal(pictureFor(letter("sh", 4)), "/letters/ship.png");
  });

  it("keeps the picture until the letter is correct 6 times in a row", () => {
    let profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    for (let i = 0; i < PICTURE_HIDE_STREAK - 1; i += 1) {
      profile = mark(profile, a, "right");
      assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    }
    profile = mark(profile, a, "right");
    assert.equal(pictureFor(a, profile), undefined);
  });

  it("resets the first-learning streak after a miss", () => {
    let profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    for (let i = 0; i < PICTURE_HIDE_STREAK - 1; i += 1) {
      profile = mark(profile, a, "right");
    }
    profile = mark(profile, a, "wrong");
    assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    for (let i = 0; i < PICTURE_HIDE_STREAK - 1; i += 1) {
      profile = mark(profile, a, "right");
      assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    }
    profile = mark(profile, a, "right");
    assert.equal(pictureFor(a, profile), undefined);
  });

  it("hides the picture immediately when the letter is way too easy", () => {
    let profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    profile = mark(profile, a, "wayTooEasy");
    assert.equal(pictureFor(a, profile), undefined);
  });

  it("brings the picture back after a mastered letter is missed", () => {
    let profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    for (let i = 0; i < PICTURE_HIDE_STREAK; i += 1) {
      profile = mark(profile, a, "right");
    }
    assert.equal(pictureFor(a, profile), undefined);
    profile = mark(profile, a, "wrong");
    assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
  });

  it("hides the picture again after three correct in a row once it has already been removed", () => {
    let profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    for (let i = 0; i < PICTURE_HIDE_STREAK; i += 1) {
      profile = mark(profile, a, "right");
    }
    profile = mark(profile, a, "wrong");
    assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    for (let i = 0; i < PICTURE_REFRESH_STREAK - 1; i += 1) {
      profile = mark(profile, a, "right");
      assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    }
    profile = mark(profile, a, "right");
    assert.equal(pictureFor(a, profile), undefined);
  });

  it("hides pictures once the text is past the letter levels", () => {
    assert.equal(pictureFor({ id: "w", text: "a", level: 11, kind: "word" }), undefined);
    assert.equal(pictureFor(letter("a", 11)), undefined);
  });

  it("does not teach isolated q", () => {
    assert.equal(
      corpus.some((item) => item.kind === "letter" && item.text === "q"),
      false,
    );
    assert.equal(
      corpus.some((item) => item.kind === "letter" && item.text === "qu"),
      true,
    );
  });
});
