import { colorPairAt, nextColorPairIndex } from "./colors.js";
import {
  emptyTextStat,
  LETTERS_MAX_LEVEL,
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
  letters: 1,
  words: 11,
  phrases: 29,
  sentences: 47,
  books: 74,
};

const LEGACY_STARTING_LEVEL: Record<Exclude<ReadingBand, "letters">, number> = {
  words: 1,
  phrases: 22,
  sentences: 42,
  books: 72,
};

export const ALGORITHM = {
  retireCorrectCount: 3,
  levelUpStreak: 25,
  easyJump: 8,
  reviewMaxDepth: 8,
  wrongCooldownMin: 2,
  wrongCooldownMax: 5,
  recentWindow: 3,
  correctWeight: 0.4,
  wrongWeight: 2.4,
} as const;

export const isLetterLevel = (level: number): boolean => level <= LETTERS_MAX_LEVEL;

export const bandFloor = (level: number): number => {
  if (level <= LETTERS_MAX_LEVEL) return STARTING_LEVEL.letters;
  if (level < STARTING_LEVEL.phrases) return STARTING_LEVEL.words;
  if (level < STARTING_LEVEL.sentences) return STARTING_LEVEL.phrases;
  if (level < STARTING_LEVEL.books) return STARTING_LEVEL.sentences;
  return STARTING_LEVEL.books;
};

export type Rng = {
  random: () => number;
  int: (min: number, max: number) => number;
};

export const defaultRng: Rng = {
  random: () => Math.random(),
  int: (min, max) => min + Math.floor(Math.random() * (max - min + 1)),
};

export const clampLevel = (level: number): number => {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
};

const remapRange = (level: number, oldMin: number, oldMax: number, newMin: number, newMax: number): number => {
  return Math.round(newMin + ((level - oldMin) * (newMax - newMin)) / (oldMax - oldMin));
};

export const remapLegacyLevel = (level: number): number => {
  const clamped = clampLevel(level);
  if (clamped <= 20) return remapRange(clamped, 1, 20, 11, 28);
  if (clamped <= 40) return remapRange(clamped, 21, 40, 29, 46);
  if (clamped <= 70) return remapRange(clamped, 41, 70, 47, 73);
  return remapRange(clamped, 71, 100, 74, 100);
};

export const migrateProfileFromV1 = (profile: Profile): Profile => {
  const level = remapLegacyLevel(profile.level);
  return {
    ...profile,
    level,
    boostLevel: remapLegacyLevel(profile.boostLevel),
    currentTextId: null,
    lastTextId: null,
    recentTextIds: [],
    textStats: {},
  };
};

export const normalizeImportedProfile = (profile: Profile): Profile => {
  if (profile.band === "letters") {
    return profile;
  }
  if (profile.events.length > 0) {
    return profile;
  }
  if (profile.level !== LEGACY_STARTING_LEVEL[profile.band]) {
    return profile;
  }
  const level = STARTING_LEVEL[profile.band];
  return {
    ...profile,
    level,
    boostLevel: level,
    currentTextId: null,
  };
};

export const setExactLevel = (profile: Profile, level: number): Profile => {
  const next = clampLevel(level);
  return {
    ...profile,
    level: next,
    boostLevel: next,
    boostActive: false,
    correctStreak: 0,
    wrongStreak: 0,
    currentTextId: null,
  };
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
    coins: 0,
    coinsEarned: 0,
    peakCoins: 0,
    inventory: [],
    correctsUntilCoin: 0,
    coinAwardsUntilBonus: defaultRng.int(10, 15),
    maxCorrectStreak: 0,
    achievements: [],
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

const isLetterCycleEligible = (profile: Profile, text: ReadingText, relax: "strict" | "repeat"): boolean => {
  const stat = getStat(profile, text.id);
  if (stat.cooldown > 0) {
    return false;
  }
  if (text.id === profile.lastTextId) {
    return false;
  }
  if (needsSupport(profile, text.id)) {
    return true;
  }
  if (relax === "strict" && profile.recentTextIds.includes(text.id)) {
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

export const hasSeenText = (profile: Profile, textId: string): boolean => {
  const stat = profile.textStats[textId];
  if (!stat) {
    return false;
  }
  return stat.correct + stat.wrong + stat.skip + stat.wayTooEasy > 0;
};

export const hasMasteredText = (profile: Profile, textId: string): boolean => {
  const stat = profile.textStats[textId];
  return Boolean(stat && (stat.correct > 0 || stat.wayTooEasy > 0));
};

export const latestResult = (profile: Profile, textId: string): ResultKind | null => {
  for (let i = profile.events.length - 1; i >= 0; i -= 1) {
    const event = profile.events[i];
    if (event.textId === textId && event.result !== "skip") {
      return event.result;
    }
  }
  return null;
};

export const needsSupport = (profile: Profile, textId: string): boolean => {
  return latestResult(profile, textId) === "wrong";
};

export const levelCoverageComplete = (profile: Profile, corpus: ReadingText[], level: number): boolean => {
  const texts = corpus.filter((text) => text.level === level);
  if (texts.length === 0) {
    return true;
  }
  return texts.every((text) => hasSeenText(profile, text.id) && hasMasteredText(profile, text.id));
};

const pickFrom = (
  texts: ReadingText[],
  profile: Profile,
  rng: Rng,
  eligible: (text: ReadingText) => boolean,
): ReadingText | null => {
  const pool = texts.filter(eligible);
  if (pool.length === 0) {
    return null;
  }
  return weightedPick(pool, profile, rng);
};

const pickReview = (profile: Profile, corpus: ReadingText[], rng: Rng): ReadingText | null => {
  const target = workingLevel(profile);
  const floor = bandFloor(target);
  const depth = Math.min(Math.max(profile.wrongStreak, 1), ALGORITHM.reviewMaxDepth);
  const tryLevel = (level: number, requireNotRecent: boolean): ReadingText | null => {
    const pool = corpus.filter((text) => {
      if (text.level !== level) {
        return false;
      }
      if (!hasMasteredText(profile, text.id)) {
        return false;
      }
      if (text.id === profile.lastTextId) {
        return false;
      }
      if (requireNotRecent && profile.recentTextIds.includes(text.id)) {
        return false;
      }
      return true;
    });
    return pool.length > 0 ? weightedPick(pool, profile, rng) : null;
  };
  for (const requireNotRecent of [true, false]) {
    for (let distance = 1; distance <= depth; distance += 1) {
      const level = target - distance;
      if (level < floor) {
        break;
      }
      const picked = tryLevel(level, requireNotRecent);
      if (picked) {
        return picked;
      }
    }
  }
  return null;
};

const pickLetterLevel = (profile: Profile, corpus: ReadingText[], rng: Rng): ReadingText => {
  const target = workingLevel(profile);
  const atLevel = corpus.filter((text) => text.level === target);
  if (atLevel.length === 0) {
    return pickOpenLevel(profile, corpus, rng);
  }

  const needsHelp = atLevel.filter((text) => needsSupport(profile, text.id));
  const unseen = atLevel.filter((text) => !hasSeenText(profile, text.id));
  const unmastered = atLevel.filter((text) => !hasMasteredText(profile, text.id));
  const groups = [needsHelp, unseen, unmastered, atLevel];

  for (const group of groups) {
    const strict = pickFrom(group, profile, rng, (text) => isLetterCycleEligible(profile, text, "strict"));
    if (strict) {
      return strict;
    }
    const relaxed = pickFrom(group, profile, rng, (text) => isLetterCycleEligible(profile, text, "repeat"));
    if (relaxed) {
      return relaxed;
    }
  }

  if (profile.wrongStreak > 0) {
    const reviewed = pickReview(profile, corpus, rng);
    if (reviewed) {
      return reviewed;
    }
  }

  const notLast = atLevel.filter((text) => text.id !== profile.lastTextId);
  const fallback = notLast.length > 0 ? notLast : atLevel;
  return fallback[rng.int(0, fallback.length - 1)];
};

const pickOpenLevel = (profile: Profile, corpus: ReadingText[], rng: Rng): ReadingText => {
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

export const pickNext = (profile: Profile, corpus: ReadingText[], rng: Rng = defaultRng): ReadingText => {
  if (corpus.length === 0) {
    throw new Error("Reading Bee corpus is empty.");
  }
  if (isLetterLevel(workingLevel(profile))) {
    return pickLetterLevel(profile, corpus, rng);
  }
  if (profile.wrongStreak > 0) {
    const reviewed = pickReview(profile, corpus, rng);
    if (reviewed) {
      return reviewed;
    }
  }
  return pickOpenLevel(profile, corpus, rng);
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
  corpus: ReadingText[] = [],
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
    if (isLetterLevel(next.level) && !next.boostActive) {
      return progressCorrect({ ...next, textStats: stats }, corpus);
    }
    const jumped = clampLevel(Math.max(next.level, text.level) + ALGORITHM.easyJump);
    const streak = next.correctStreak + 1;
    return {
      ...next,
      textStats: stats,
      boostActive: true,
      boostLevel: jumped,
      correctStreak: streak,
      maxCorrectStreak: Math.max(next.maxCorrectStreak, streak),
      wrongStreak: 0,
    };
  }

  if (result === "right") {
    stat.correct += 1;
    if (stat.correct >= ALGORITHM.retireCorrectCount) {
      stat.retired = true;
    }
    stats = { ...stats, [text.id]: stat };
    return progressCorrect({ ...next, textStats: stats }, corpus);
  }

  stat.wrong += 1;
  stat.retired = false;
  stat.cooldown = text.kind === "letter" ? 0 : rng.int(ALGORITHM.wrongCooldownMin, ALGORITHM.wrongCooldownMax);
  stats = { ...stats, [text.id]: stat };
  const wasBoosting = next.boostActive;
  const wrongStreak = wasBoosting ? 1 : next.wrongStreak + 1;
  return {
    ...next,
    textStats: stats,
    boostActive: false,
    correctStreak: 0,
    wrongStreak,
  };
};

const progressCorrect = (profile: Profile, corpus: ReadingText[]): Profile => {
  const streak = profile.correctStreak + 1;
  const activeLevel = workingLevel(profile);
  const coverageOk = !isLetterLevel(activeLevel) || levelCoverageComplete(profile, corpus, activeLevel);
  const shouldLevelUp = streak >= ALGORITHM.levelUpStreak && coverageOk;
  const level = shouldLevelUp ? clampLevel(activeLevel + 1) : profile.level;
  return {
    ...profile,
    correctStreak: shouldLevelUp ? 0 : streak,
    maxCorrectStreak: Math.max(profile.maxCorrectStreak, streak),
    wrongStreak: 0,
    level,
    boostActive: shouldLevelUp ? false : profile.boostActive,
    boostLevel: shouldLevelUp ? level : profile.boostLevel,
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
  const updated = applyResult(profile, text, result, rng, at, corpus);
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
