import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pictureFor } from "./letter-pictures.js";
import { ReadingText } from "./type.app.js";

const letterA: ReadingText = { id: "l001-000", text: "a", level: 1, kind: "letter" };
const letterQu: ReadingText = { id: "l003-006", text: "qu", level: 3, kind: "letter" };
const wordA: ReadingText = { id: "l011-007", text: "a", level: 11, kind: "word" };

describe("pictureFor", () => {
  it("shows the apple for the letter a on early levels", () => {
    assert.equal(pictureFor(letterA), "/apple.jpg");
  });

  it("does not invent pictures for letters that do not have one yet", () => {
    assert.equal(pictureFor(letterQu), undefined);
  });

  it("hides pictures once the text is past the letter levels", () => {
    assert.equal(pictureFor(wordA), undefined);
    assert.equal(pictureFor({ ...letterA, level: 11 }), undefined);
  });
});
