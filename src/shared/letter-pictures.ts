import { emptyTextStat, LETTERS_MAX_LEVEL, Profile, ReadingText, ResultKind } from "./type.app.js";

export const PICTURE_MAX_LEVEL = LETTERS_MAX_LEVEL;
export const PICTURE_HIDE_STREAK = 6;
export const PICTURE_REFRESH_STREAK = 3;
export const PICTURE_PERMANENT_STREAK = 30;
export const PICTURE_MEMORY_SHOWS = 3;
export const PICTURE_MEMORY_AFTER_MS = 60 * 60 * 1000;

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

const latestResult = (profile: Profile, textId: string): ResultKind | null => {
  for (let i = profile.events.length - 1; i >= 0; i -= 1) {
    const event = profile.events[i];
    if (event.textId === textId && event.result !== "skip") {
      return event.result;
    }
  }
  return null;
};

const consecutiveRights = (profile: Profile, textId: string): number => {
  let streak = 0;
  for (let i = profile.events.length - 1; i >= 0; i -= 1) {
    const event = profile.events[i];
    if (event.textId !== textId || event.result === "skip") {
      continue;
    }
    if (event.result === "right") {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
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

const hideStreakNeeded = (profile: Profile, textId: string): number =>
  hasUnlockedPictureRemoval(profile, textId) ? PICTURE_REFRESH_STREAK : PICTURE_HIDE_STREAK;

const isNormallyHidden = (profile: Profile, textId: string): boolean => {
  const latest = latestResult(profile, textId);
  if (latest === "wrong" || latest === "wayTooEasy") {
    return false;
  }
  const rights = consecutiveRights(profile, textId);
  return rights >= hideStreakNeeded(profile, textId);
};

const lastPictureAt = (profile: Profile, textId: string): string | undefined => {
  const stored = profile.textStats[textId]?.lastPictureAt;
  if (stored) {
    return stored;
  }
  // Infer for profiles saved before lastPictureAt existed: last answer while the
  // picture would still have been in the learning / post-miss window.
  let rights = 0;
  let unlocked = false;
  let inferred: string | undefined;
  for (const event of profile.events) {
    if (event.textId !== textId || event.result === "skip") {
      continue;
    }
    const needed = unlocked ? PICTURE_REFRESH_STREAK : PICTURE_HIDE_STREAK;
    if (event.result === "wrong") {
      inferred = event.at;
      rights = 0;
      continue;
    }
    if (event.result === "wayTooEasy") {
      unlocked = true;
      rights = 0;
      continue;
    }
    if (event.result === "right") {
      if (rights < needed) {
        inferred = event.at;
      }
      rights += 1;
      if (rights >= PICTURE_HIDE_STREAK) {
        unlocked = true;
      }
    }
  }
  return inferred;
};

export const pictureFor = (text: ReadingText, profile?: Profile, now = new Date()): string | undefined => {
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
  if (latest === "wayTooEasy") {
    return undefined;
  }
  const rights = consecutiveRights(profile, text.id);
  if (rights >= PICTURE_PERMANENT_STREAK) {
    return undefined;
  }
  const needed = hideStreakNeeded(profile, text.id);
  if (rights < needed) {
    return picture;
  }
  const refreshLeft = profile.textStats[text.id]?.pictureRefreshLeft ?? 0;
  if (refreshLeft > 0) {
    return picture;
  }
  const seenAt = lastPictureAt(profile, text.id);
  if (seenAt && now.getTime() - new Date(seenAt).getTime() >= PICTURE_MEMORY_AFTER_MS) {
    return picture;
  }
  return undefined;
};

/** Record that the student just saw this letter with its picture. */
export const trackPictureSeen = (
  profileAfter: Profile,
  textId: string,
  profileBefore: Profile,
  at = new Date(),
): Profile => {
  const stat = { ...(profileAfter.textStats[textId] ?? emptyTextStat(textId)) };
  if (isNormallyHidden(profileBefore, textId)) {
    const left = stat.pictureRefreshLeft ?? 0;
    stat.pictureRefreshLeft = left > 0 ? left - 1 : PICTURE_MEMORY_SHOWS - 1;
  } else {
    stat.pictureRefreshLeft = 0;
  }
  stat.lastPictureAt = at.toISOString();
  return {
    ...profileAfter,
    textStats: {
      ...profileAfter.textStats,
      [textId]: stat,
    },
  };
};
