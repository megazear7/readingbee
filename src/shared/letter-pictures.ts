import { hasMasteredText, latestResult } from "./algorithm.js";
import { LETTERS_MAX_LEVEL, Profile, ReadingText } from "./type.app.js";

export const PICTURE_MAX_LEVEL = LETTERS_MAX_LEVEL;

export const LETTER_PICTURES: Record<string, string> = {
  a: "/letters/apple.webp",
  b: "/letters/boy.webp",
  c: "/letters/cat.webp",
  d: "/letters/dog.webp",
  e: "/letters/egg.webp",
  f: "/letters/fish.webp",
  g: "/letters/goat.webp",
  h: "/letters/hat.webp",
  i: "/letters/igloo.webp",
  j: "/letters/jar.webp",
  k: "/letters/kite.webp",
  l: "/letters/lamp.webp",
  m: "/letters/man.webp",
  n: "/letters/nest.webp",
  o: "/letters/octopus.webp",
  p: "/letters/pig.webp",
  qu: "/letters/queen.webp",
  r: "/letters/rat.webp",
  s: "/letters/snake.webp",
  t: "/letters/tiger.webp",
  u: "/letters/up.webp",
  v: "/letters/van.webp",
  w: "/letters/wagon.webp",
  x: "/letters/fox.webp",
  y: "/letters/yoyo.webp",
  z: "/letters/zebra.webp",
  wh: "/letters/whistle.webp",
  th: "/letters/thumb.webp",
  ch: "/letters/chair.webp",
  sh: "/letters/ship.webp",
};

export const pictureFor = (text: ReadingText, profile?: Profile): string | undefined => {
  if (text.kind !== "letter" || text.level > PICTURE_MAX_LEVEL) {
    return undefined;
  }
  const picture = LETTER_PICTURES[text.text.trim().toLowerCase()];
  if (!picture || !profile) {
    return picture;
  }
  const latest = latestResult(profile, text.id);
  if (latest === "wrong") {
    return picture;
  }
  if (latest === "right" || latest === "wayTooEasy" || hasMasteredText(profile, text.id)) {
    return undefined;
  }
  return picture;
};
