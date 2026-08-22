import z from "zod";

export const STORAGE_KEY = "reading-bee:v1";
export const APP_VERSION = 3;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;
export const LETTERS_MAX_LEVEL = 10;
export const PASSCODE_LENGTH = 4;

export const ReadingBand = z.enum(["letters", "words", "phrases", "sentences", "books"]);
export type ReadingBand = z.infer<typeof ReadingBand>;

export const ReadingKind = z.enum(["letter", "word", "phrase", "sentence", "book"]);
export type ReadingKind = z.infer<typeof ReadingKind>;

export const ResultKind = z.enum(["right", "wrong", "skip", "wayTooEasy"]);
export type ResultKind = z.infer<typeof ResultKind>;

export const ReadingText = z.object({
  id: z.string(),
  text: z.string(),
  level: z.number().int().min(MIN_LEVEL).max(MAX_LEVEL),
  kind: ReadingKind,
});
export type ReadingText = z.infer<typeof ReadingText>;

export const ReadingEvent = z.object({
  id: z.string(),
  textId: z.string(),
  text: z.string(),
  level: z.number().int(),
  result: ResultKind,
  at: z.string(),
});
export type ReadingEvent = z.infer<typeof ReadingEvent>;

export const TextStat = z.object({
  textId: z.string(),
  correct: z.number().int().nonnegative(),
  wrong: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  wayTooEasy: z.number().int().nonnegative(),
  cooldown: z.number().int().nonnegative(),
  retired: z.boolean(),
  lastPictureAt: z.string().optional(),
  pictureRefreshLeft: z.number().int().nonnegative().optional(),
});
export type TextStat = z.infer<typeof TextStat>;

export const Profile = z.object({
  id: z.string(),
  name: z.string().min(1),
  colorPairIndex: z.number().int().nonnegative(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  band: ReadingBand,
  level: z.number().int().min(MIN_LEVEL).max(MAX_LEVEL),
  createdAt: z.string(),
  currentTextId: z.string().nullable(),
  lastTextId: z.string().nullable(),
  recentTextIds: z.array(z.string()),
  boostActive: z.boolean(),
  boostLevel: z.number().int().min(MIN_LEVEL).max(MAX_LEVEL),
  correctStreak: z.number().int().nonnegative(),
  wrongStreak: z.number().int().nonnegative(),
  textStats: z.record(z.string(), TextStat),
  events: z.array(ReadingEvent),
  coins: z.number().int().nonnegative().default(0),
  coinsEarned: z.number().int().nonnegative().default(0),
  peakCoins: z.number().int().nonnegative().default(0),
  inventory: z.array(z.string()).default([]),
  correctsUntilCoin: z.number().nonnegative().multipleOf(0.5).default(0),
  coinAwardsUntilBonus: z.number().int().nonnegative().default(0),
  maxCorrectStreak: z.number().int().nonnegative().default(0),
  achievements: z.array(z.string()).default([]),
});
export type Profile = z.infer<typeof Profile>;

export const AppState = z.object({
  version: z.literal(APP_VERSION),
  passcode: z.string().nullable(),
  currentProfileId: z.string().nullable(),
  profiles: z.array(Profile),
});
export type AppState = z.infer<typeof AppState>;

export const emptyAppState = (): AppState => ({
  version: APP_VERSION,
  passcode: null,
  currentProfileId: null,
  profiles: [],
});

export const emptyTextStat = (textId: string): TextStat => ({
  textId,
  correct: 0,
  wrong: 0,
  skip: 0,
  wayTooEasy: 0,
  cooldown: 0,
  retired: false,
});
