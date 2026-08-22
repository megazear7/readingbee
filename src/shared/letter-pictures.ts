import { latestResult } from "./algorithm.js";
import { LETTERS_MAX_LEVEL, Profile, ReadingText } from "./type.app.js";

export const PICTURE_MAX_LEVEL = LETTERS_MAX_LEVEL;
export const PICTURE_HIDE_STREAK = 6;

export const LETTER_PICTURES: Record<string, string> = {
  a: "/letters/apple.png",
  b: "/letters/boy.png",
  c: "/letters/cat.png",
  d: "/letters/dog.png",
  e: "/letters/egg.png",
  f: "/letters/fish.png",
  g: "/letters/goat.png",
  h: "/letters/hat.png",
  i: "/letters/igloo.png",
  j: "/letters/jar.png",
  k: "/letters/kite.png",
  l: "/letters/lamp.png",
  m: "/letters/man.png",
  n: "/letters/nest.png",
  o: "/letters/octopus.png",
  p: "/letters/pig.png",
  qu: "/letters/queen.png",
  r: "/letters/rat.png",
  s: "/letters/snake.png",
  t: "/letters/tiger.png",
  u: "/letters/up.png",
  v: "/letters/van.png",
  w: "/letters/wagon.png",
  x: "/letters/fox.png",
  y: "/letters/yoyo.png",
  z: "/letters/zebra.png",
  wh: "/letters/whistle.png",
  th: "/letters/thumb.png",
  ch: "/letters/chair.png",
  sh: "/letters/ship.png",
};

const hasUnlockedPictureRemoval = (profile: Profile, textId: string): boolean => {
  let streak = 0;
  for (const event of profile.events) {
    if (event.textId !== textId || event.result === "skip") {
      continue;
    }
    if (event.result === "wayTooEasy") {
      return true;
    }
    if (event.result === "right") {
      streak += 1;
      if (streak >= PICTURE_HIDE_STREAK) {
        return true;
      }
      continue;
    }
    streak = 0;
  }
  return false;
};

export const pictureFor = (text: ReadingText, profile?: Profile): string | undefined => {
  if (text.kind !== "letter" || text.level > PICTURE_MAX_LEVEL) {
    return undefined;
  }
  const picture = LETTER_PICTURES[text.text.trim().toLowerCase()];
  if (!picture || !profile) {
    return picture;
  }
  if (latestResult(profile, text.id) === "wrong") {
    return picture;
  }
  if (hasUnlockedPictureRemoval(profile, text.id)) {
    return undefined;
  }
  return picture;
};
