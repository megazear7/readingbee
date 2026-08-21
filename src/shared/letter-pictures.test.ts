import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProfile } from "./algorithm.js";
import { corpus } from "./corpus.js";
import { LETTER_PICTURES, pictureFor } from "./letter-pictures.js";
import { emptyTextStat, ReadingText } from "./type.app.js";

const letter = (text: string, level = 1): ReadingText => ({
  id: `l-${text}`,
  text,
  level,
  kind: "letter",
});

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
    assert.equal(pictureFor(letter("qu", 3)), "/letters/queen.webp");
    assert.equal(pictureFor(letter("wh", 4)), "/letters/whistle.webp");
    assert.equal(pictureFor(letter("th", 4)), "/letters/thumb.webp");
    assert.equal(pictureFor(letter("ch", 4)), "/letters/chair.webp");
    assert.equal(pictureFor(letter("sh", 4)), "/letters/ship.webp");
  });

  it("hides pictures once the student has mastered the sound", () => {
    const profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
    profile.textStats[a.id] = { ...emptyTextStat(a.id), correct: 1 };
    profile.events.push({
      id: "e1",
      textId: a.id,
      text: a.text,
      level: a.level,
      result: "right",
      at: new Date().toISOString(),
    });
    assert.equal(pictureFor(a, profile), undefined);
  });

  it("brings the picture back after a mastered letter is missed", () => {
    const profile = createProfile("Ava", "letters", []);
    const a = letter("a");
    profile.textStats[a.id] = { ...emptyTextStat(a.id), correct: 1, wrong: 1 };
    profile.events.push(
      {
        id: "e1",
        textId: a.id,
        text: a.text,
        level: a.level,
        result: "right",
        at: new Date().toISOString(),
      },
      {
        id: "e2",
        textId: a.id,
        text: a.text,
        level: a.level,
        result: "wrong",
        at: new Date().toISOString(),
      },
    );
    assert.equal(pictureFor(a, profile), LETTER_PICTURES.a);
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
