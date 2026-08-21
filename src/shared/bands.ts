import { ReadingBand } from "./type.app.js";

export const READING_BANDS: { id: ReadingBand; label: string; detail: string }[] = [
  { id: "words", label: "I read words", detail: "Cat, sun, jump" },
  { id: "phrases", label: "I read phrases", detail: "The red hat" },
  { id: "sentences", label: "I read sentences", detail: "The cat sat on the mat." },
  { id: "books", label: "I read books", detail: "Short stories and pages" },
];
