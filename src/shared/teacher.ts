import { ACHIEVEMENTS } from "./achievements.js";
import { ALGORITHM, hasMasteredText, hasSeenText, isLetterLevel, profileStats, workingLevel } from "./algorithm.js";
import { READING_BANDS } from "./bands.js";
import { corpus, corpusById } from "./corpus.js";
import { shopCoinsSpent } from "./shop-items.js";
import { MAX_LEVEL, Profile, ReadingText, ResultKind } from "./type.app.js";

export type TeacherMeter = {
  label: string;
  value: number;
  max: number;
};

export type TeacherRecent = {
  result: ResultKind;
  text: string;
  at: string;
};

export type TeacherSnapshot = {
  name: string;
  bandLabel: string;
  level: number;
  workingLevel: number;
  nextLevel: number;
  remaining: number;
  progressPercent: number;
  boostActive: boolean;
  atMaxLevel: boolean;
  reviewMode: boolean;
  wrongStreak: number;
  meters: TeacherMeter[];
  headline: string;
  detail: string;
  note: string;
  figure: string;
  tags: string[];
  stats: { read: number; right: number; wrong: number; skip: number; wayTooEasy: number; accuracy: string };
  mastered: number;
  currentText: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  readsToday: number;
  readsWeek: number;
  coins: number;
  coinsEarned: number;
  peakCoins: number;
  spent: number;
  items: number;
  achievements: number;
  achievementTotal: number;
  maxCorrectStreak: number;
  recent: TeacherRecent[];
  isCurrent: boolean;
};

const bandLabel = (band: Profile["band"]): string => {
  return READING_BANDS.find((item) => item.id === band)?.label ?? band;
};

const dayStart = (now: Date): number => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
};

const countSince = (profile: Profile, since: number): number => {
  return profile.events.filter((event) => Date.parse(event.at) >= since).length;
};

const coverage = (
  profile: Profile,
  texts: ReadingText[],
  level: number,
): { total: number; seen: number; mastered: number } => {
  const atLevel = texts.filter((text) => text.level === level);
  return {
    total: atLevel.length,
    seen: atLevel.filter((text) => hasSeenText(profile, text.id)).length,
    mastered: atLevel.filter((text) => hasMasteredText(profile, text.id)).length,
  };
};

export const teacherSnapshot = (
  profile: Profile,
  currentProfileId: string | null = null,
  texts: ReadingText[] = corpus,
  now = new Date(),
): TeacherSnapshot => {
  const stats = profileStats(profile);
  const scored = stats.right + stats.wrong;
  const work = workingLevel(profile);
  const letters = isLetterLevel(work);
  const sounds = letters ? coverage(profile, texts, work) : null;
  const needed = ALGORITHM.levelUpStreak;
  const streak = profile.correctStreak;
  const atMaxLevel = profile.level >= MAX_LEVEL && !profile.boostActive;
  const coverageOk = !sounds || (sounds.total > 0 && sounds.seen === sounds.total && sounds.mastered === sounds.total);
  const nextLevel = Math.min(MAX_LEVEL, work + 1);
  const meters: TeacherMeter[] = [{ label: "Right in a row", value: streak, max: needed }];
  if (sounds) {
    meters.push({ label: "Sounds practiced", value: sounds.mastered, max: Math.max(1, sounds.total) });
  }

  let headline = "";
  let detail = "";
  let note = "";
  let remaining = 0;
  let progressPercent = 0;
  if (atMaxLevel) {
    headline = "Highest level reached";
    detail = `${profile.name} is at the top of the reading path.`;
    note = "There is no further automatic level-up from here.";
    remaining = 0;
    progressPercent = 100;
  } else if (letters && !coverageOk && sounds) {
    remaining = Math.max(0, sounds.total - sounds.mastered);
    headline = remaining === 1 ? "1 sound still to practice" : `${remaining} sounds still to practice`;
    detail = `${sounds.mastered} of ${sounds.total} sounds at this level have been practiced.`;
    note =
      "The level will not go up until every sound at this level has been seen and practiced, and the streak is complete.";
    progressPercent = Math.min(100, Math.round((sounds.mastered / Math.max(1, sounds.total)) * 100));
  } else {
    remaining = Math.max(0, needed - streak);
    headline =
      remaining === 0
        ? "Ready to level up"
        : remaining === 1
          ? "1 more right in a row"
          : `${remaining} more right in a row`;
    detail = `${streak} of ${needed} consecutive correct answers toward level ${nextLevel}.`;
    note = profile.boostActive
      ? `A boost is active, so right answers count toward working level ${work} (badge ${profile.level}).`
      : "The gold badge never goes down. After misses, easier mastered text can appear for support.";
    progressPercent = Math.min(100, Math.round((streak / needed) * 100));
  }

  const last = profile.events[profile.events.length - 1];
  const today = dayStart(now);
  const week = today - 6 * 24 * 60 * 60 * 1000;
  const current = profile.currentTextId ? (corpusById[profile.currentTextId] ?? null) : null;
  const spent = shopCoinsSpent(profile.inventory);
  const isCurrent = profile.id === currentProfileId;
  const tags: string[] = [];
  if (isCurrent) tags.push("Reading now");
  if (profile.wrongStreak > 0) tags.push("Support mix");
  if (profile.boostActive) tags.push("Boost");
  if (atMaxLevel) tags.push("Highest level");

  const figure = atMaxLevel ? "Max" : remaining === 0 ? "Ready" : String(remaining);

  return {
    name: profile.name,
    bandLabel: bandLabel(profile.band),
    level: profile.level,
    workingLevel: work,
    nextLevel,
    remaining,
    progressPercent,
    boostActive: profile.boostActive,
    atMaxLevel,
    reviewMode: profile.wrongStreak > 0,
    wrongStreak: profile.wrongStreak,
    meters,
    headline,
    detail,
    note,
    figure,
    tags,
    stats: {
      ...stats,
      accuracy: scored === 0 ? "—" : `${Math.round((stats.right / scored) * 100)}%`,
    },
    mastered: Object.values(profile.textStats).filter((stat) => stat.retired).length,
    currentText: current?.text ?? null,
    lastActiveAt: last?.at ?? null,
    createdAt: profile.createdAt,
    readsToday: countSince(profile, today),
    readsWeek: countSince(profile, week),
    coins: profile.coins,
    coinsEarned: profile.coinsEarned,
    peakCoins: profile.peakCoins,
    spent,
    items: profile.inventory.length,
    achievements: profile.achievements.length,
    achievementTotal: ACHIEVEMENTS.length,
    maxCorrectStreak: profile.maxCorrectStreak,
    recent: profile.events
      .slice(-8)
      .reverse()
      .map((event) => ({
        result: event.result,
        text: event.text,
        at: event.at,
      })),
    isCurrent,
  };
};

export const formatTeacherDate = (iso: string, now = new Date()): string => {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "Unknown";
  const delta = now.getTime() - then;
  if (delta < 45_000) return "Just now";
  if (delta < 3_600_000) return `${Math.max(1, Math.round(delta / 60_000))} min ago`;
  if (delta < 22 * 3_600_000) return `${Math.max(1, Math.round(delta / 3_600_000))} hr ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const recentLabel = (result: ResultKind): string => {
  if (result === "right") return "Right";
  if (result === "wrong") return "Practice";
  if (result === "skip") return "Skip";
  return "Easy";
};
