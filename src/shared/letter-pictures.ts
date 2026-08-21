import { LETTERS_MAX_LEVEL, ReadingText } from "./type.app.js";

export const PICTURE_MAX_LEVEL = LETTERS_MAX_LEVEL;

export const LETTER_PICTURES: Record<string, string> = {
  a: "/letters/apple.webp",
  b: "/letters/ball.webp",
  c: "/letters/cat.webp",
  d: "/letters/dog.webp",
  e: "/letters/egg.webp",
  f: "/letters/fish.webp",
  g: "/letters/grapes.webp",
  h: "/letters/hat.webp",
  i: "/letters/iguana.webp",
  j: "/letters/jam.webp",
  k: "/letters/kite.webp",
  l: "/letters/leaf.webp",
  m: "/letters/mouse.webp",
  n: "/letters/nest.webp",
  o: "/letters/orange.webp",
  p: "/letters/pig.webp",
  q: "/letters/quilt.webp",
  r: "/letters/rabbit.webp",
  s: "/letters/sun.webp",
  t: "/letters/tree.webp",
  u: "/letters/umbrella.webp",
  v: "/letters/violin.webp",
  w: "/letters/whale.webp",
  x: "/letters/xray.webp",
  y: "/letters/yoyo.webp",
  z: "/letters/zebra.webp",
};

export const pictureFor = (text: ReadingText): string | undefined => {
  if (text.kind !== "letter" || text.level > PICTURE_MAX_LEVEL) {
    return undefined;
  }
  return LETTER_PICTURES[text.text.trim().toLowerCase()];
};
