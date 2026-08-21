import { colorPairAt, nextColorPairIndex } from "./colors.js";
import {
  emptyTextStat,
  MAX_LEVEL,
  MIN_LEVEL,
  Profile,
  ReadingBand,
  ReadingEvent,
  ReadingText,
  ResultKind,
  TextStat,
} from "./type.app.js";
import { createId } from "./util.id.js";

export const STARTING_LEVEL: Record<ReadingBand, number> = {
  words: 1,
  phrases: 22,
  sentences: 42,
  books: 72,
};

export const ALGORITHM = {
  retireCorrectCount: 3,
  levelUpStreak: 5,
  levelDownStreak: 3,
  easyJump: 8,
  wrongCooldownMin: 2,
  wrongCooldownMax: 5,
  recentWindow: 3,
  correctWeight: 0.4,
  wrongWeight: 2.4,
} as const;

export type Rng = {
  random: () => number;
  int: (min: number, max: number) => number;
};

export const defaultRng: Rng = {
  random: () => Math.random(),
  int: (min, max) => min + Math.floor(Math.random() * (max - min + 1)),
};

export const createProfile = (
  name: string,
  band: ReadingBand,
  usedColorIndexes: number[],
  now = new Date(),
  colorPairIndex = nextColorPairIndex(usedColorIndexes),
): Profile => {
  const colors = colorPairAt(colorPairIndex);
  const level = STARTING_LEVEL[band];
  return {
    id: createId(),
    name: name.trim(),
    colorPairIndex,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    band,
    level,
    createdAt: now.toISOString(),
    currentTextId: null,
    lastTextId: null,
    recentTextIds: [],
    boostActive: false,
    boostLevel: level,
    correctStreak: 0,
    wrongStreak: 0,
    textStats: {},
    events: [],
  };
};

export const applyColorPair = (profile: Profile, colorPairIndex: number): Profile => {
  const colors = colorPairAt(colorPairIndex);
  return {
    ...profile,
    colorPairIndex,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
  };
};

export const workingLevel = (profile: Profile): number => {
  return profile.boostActive ? profile.boostLevel : profile.level;
};

const clampLevel = (level: number): number => {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
};

const getStat = (profile: Profile, textId: string): TextStat => {
  return profile.textStats[textId] ?? emptyTextStat(textId);
};

const tickCooldowns = (stats: Record<string, TextStat>, exceptId: string): Record<string, TextStat> => {
  const next: Record<string, TextStat> = {};
  for (const [id, stat] of Object.entries(stats)) {
    if (id === exceptId) {
      next[id] = stat;
      continue;
    }
    next[id] = stat.cooldown > 0 ? { ...stat, cooldown: stat.cooldown - 1 } : stat;
  }
  return next;
};

const rememberRecent = (recent: string[], textId: string): string[] => {
  const next = [textId, ...recent.filter((id) => id !== textId)];
  return next.slice(0, ALGORITHM.recentWindow);
};

const isEligible = (profile: Profile, text: ReadingText): boolean => {
  const stat = getStat(profile, text.id);
  if (stat.retired) {
    return false;
  }
  if (stat.cooldown > 0) {
    return false;
  }
  if (text.id === profile.lastTextId) {
    return false;
  }
  if (profile.recentTextIds.includes(text.id)) {
    return false;
  }
  return true;
};

export const textWeight = (stat: TextStat): number => {
  if (stat.retired) {
    return 0;
  }
  return Math.pow(ALGORITHM.correctWeight, stat.correct) * Math.pow(ALGORITHM.wrongWeight, stat.wrong);
};

const weightedPick = (texts: ReadingText[], profile: Profile, rng: Rng): ReadingText => {
  const weights = texts.map((text) => Math.max(0.0001, textWeight(getStat(profile, text.id))));
  const sum = weights.reduce((total, weight) => total + weight, 0);
  let cursor = rng.random() * sum;
  for (let i = 0; i < texts.length; i += 1) {
    cursor -= weights[i];
    if (cursor <= 0) {
      return texts[i];
    }
  }
  return texts[texts.length - 1];
};

export const pickNext = (profile: Profile, corpus: ReadingText[], rng: Rng = defaultRng): ReadingText => {
  if (corpus.length === 0) {
    throw new Error("Reading Bee corpus is empty.");
  }

  const target = workingLevel(profile);
  for (let radius = 0; radius <= MAX_LEVEL; radius += 1) {
    const pool = corpus.filter((text) => Math.abs(text.level - target) <= radius && isEligible(profile, text));
    if (pool.length > 0) {
      return weightedPick(pool, profile, rng);
    }
  }

  const notLast = corpus.filter((text) => text.id !== profile.lastTextId);
  const fallback = notLast.length > 0 ? notLast : corpus;
  return fallback[rng.int(0, fallback.length - 1)];
};

export const ensureCurrentText = (profile: Profile, corpus: ReadingText[], rng: Rng = defaultRng): Profile => {
  if (profile.currentTextId && corpus.some((text) => text.id === profile.currentTextId)) {
    return profile;
  }
  const next = pickNext(profile, corpus, rng);
  return { ...profile, currentTextId: next.id };
};

export const applyResult = (
  profile: Profile,
  text: ReadingText,
  result: ResultKind,
  rng: Rng = defaultRng,
  at = new Date(),
): Profile => {
  const event: ReadingEvent = {
    id: createId(),
    textId: text.id,
    text: text.text,
    level: text.level,
    result,
    at: at.toISOString(),
  };

  let stats = tickCooldowns(profile.textStats, text.id);
  const stat = { ...(stats[text.id] ?? emptyTextStat(text.id)) };
  const next: Profile = {
    ...profile,
    textStats: stats,
    events: [...profile.events, event],
    lastTextId: text.id,
    recentTextIds: rememberRecent(profile.recentTextIds, text.id),
    currentTextId: null,
  };

  if (result === "skip") {
    stat.skip += 1;
    stats = { ...stats, [text.id]: stat };
    return { ...next, textStats: stats };
  }

  if (result === "wayTooEasy") {
    stat.wayTooEasy += 1;
    stats = { ...stats, [text.id]: stat };
    const jumped = clampLevel(Math.max(next.level, text.level) + ALGORITHM.easyJump);
    return {
      ...next,
      textStats: stats,
      boostActive: true,
      boostLevel: jumped,
      correctStreak: next.correctStreak + 1,
      wrongStreak: 0,
    };
  }

  if (result === "right") {
    stat.correct += 1;
    if (stat.correct >= ALGORITHM.retireCorrectCount) {
      stat.retired = true;
    }
    stats = { ...stats, [text.id]: stat };
    const streak = next.correctStreak + 1;
    const activeLevel = workingLevel(next);
    const shouldLevelUp = streak >= ALGORITHM.levelUpStreak;
    const level = shouldLevelUp ? clampLevel(activeLevel + 1) : next.level;
    return {
      ...next,
      textStats: stats,
      correctStreak: shouldLevelUp ? 0 : streak,
      wrongStreak: 0,
      level,
      boostActive: shouldLevelUp ? false : next.boostActive,
      boostLevel: shouldLevelUp ? level : next.boostLevel,
    };
  }

  stat.wrong += 1;
  stat.cooldown = rng.int(ALGORITHM.wrongCooldownMin, ALGORITHM.wrongCooldownMax);
  stats = { ...stats, [text.id]: stat };
  const wasBoosting = next.boostActive;
  const wrongStreak = wasBoosting ? 1 : next.wrongStreak + 1;
  const shouldDrop = !wasBoosting && wrongStreak >= ALGORITHM.levelDownStreak;
  return {
    ...next,
    textStats: stats,
    boostActive: false,
    correctStreak: 0,
    wrongStreak: shouldDrop ? 0 : wrongStreak,
    level: shouldDrop ? clampLevel(next.level - 1) : next.level,
  };
};

export const recordAndPickNext = (
  profile: Profile,
  text: ReadingText,
  result: ResultKind,
  corpus: ReadingText[],
  rng: Rng = defaultRng,
  at = new Date(),
): Profile => {
  const updated = applyResult(profile, text, result, rng, at);
  const nextText = pickNext(updated, corpus, rng);
  return { ...updated, currentTextId: nextText.id };
};

export const profileStats = (
  profile: Profile,
): { read: number; right: number; wrong: number; skip: number; wayTooEasy: number } => {
  let right = 0;
  let wrong = 0;
  let skip = 0;
  let wayTooEasy = 0;
  for (const event of profile.events) {
    if (event.result === "right") right += 1;
    if (event.result === "wrong") wrong += 1;
    if (event.result === "skip") skip += 1;
    if (event.result === "wayTooEasy") wayTooEasy += 1;
  }
  return { read: profile.events.length, right, wrong, skip, wayTooEasy };
};
