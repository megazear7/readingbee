import { LETTERS_MAX_LEVEL, ReadingText } from "./type.app.js";

export const PICTURE_MAX_LEVEL = LETTERS_MAX_LEVEL;

export const LETTER_PICTURES: Record<string, string> = {
  a: "/apple.jpg",
};

export const pictureFor = (text: ReadingText): string | undefined => {
  if (text.kind !== "letter" || text.level > PICTURE_MAX_LEVEL) {
    return undefined;
  }
  return LETTER_PICTURES[text.text.trim().toLowerCase()];
};
