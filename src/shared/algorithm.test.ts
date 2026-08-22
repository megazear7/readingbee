import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALGORITHM,
  applyResult,
  createProfile,
  pickNext,
  recordAndPickNext,
  remapLegacyLevel,
  Rng,
  setExactLevel,
  STARTING_LEVEL,
  textWeight,
} from "./algorithm.js";
import { Profile, ReadingText } from "./type.app.js";

const seedRng = (seed = 1): Rng => {
  let value = seed;
  const random = (): number => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
  return {
    random,
    int: (min: number, max: number): number => min + Math.floor(random() * (max - min + 1)),
  };
};

const kindFor = (level: number): ReadingText["kind"] => {
  if (level <= 10) return "letter";
  if (level <= 28) return "word";
  if (level <= 46) return "phrase";
  if (level <= 73) return "sentence";
  return "book";
};

const makeCorpus = (): ReadingText[] => {
  const corpus: ReadingText[] = [];
  for (let level = 1; level <= 100; level += 1) {
    for (let i = 0; i < 8; i += 1) {
      corpus.push({
        id: `t-${level}-${i}`,
        text: `text ${level}.${i}`,
        level,
        kind: kindFor(level),
      });
    }
  }
  return corpus;
};

const corpus = makeCorpus();
const byId = Object.fromEntries(corpus.map((item) => [item.id, item]));

const score = (profile: Profile, textId: string, result: "right" | "wrong" | "skip" | "wayTooEasy"): Profile =>
  applyResult(profile, byId[textId], result, seedRng(2), new Date(), corpus);

describe("createProfile", () => {
  it("starts at the band level with auto colors", () => {
    const first = createProfile("Ava", "letters", []);
    const second = createProfile("Max", "sentences", [first.colorPairIndex]);
    assert.equal(first.level, STARTING_LEVEL.letters);
    assert.equal(second.level, STARTING_LEVEL.sentences);
    assert.notEqual(first.colorPairIndex, second.colorPairIndex);
    assert.equal(first.primaryColor.startsWith("#"), true);
  });
});

describe("remapLegacyLevel", () => {
  it("squeezes the old 1-100 scale into 11-100", () => {
    assert.equal(remapLegacyLevel(1), 11);
    assert.equal(remapLegacyLevel(20), 28);
    assert.equal(remapLegacyLevel(21), 29);
    assert.equal(remapLegacyLevel(40), 46);
    assert.equal(remapLegacyLevel(41), 47);
    assert.equal(remapLegacyLevel(70), 73);
    assert.equal(remapLegacyLevel(71), 74);
    assert.equal(remapLegacyLevel(100), 100);
  });
});

describe("setExactLevel", () => {
  it("clamps and resets the working level", () => {
    const profile = { ...createProfile("Ava", "words", []), boostActive: true, correctStreak: 4 };
    const next = setExactLevel(profile, 7.6);
    assert.equal(next.level, 8);
    assert.equal(next.boostLevel, 8);
    assert.equal(next.boostActive, false);
    assert.equal(next.correctStreak, 0);
    assert.equal(next.currentTextId, null);
  });
});

describe("pickNext", () => {
  it("does not return the last text immediately", () => {
    const rng = seedRng(3);
    const profile = {
      ...createProfile("Ava", "letters", []),
      currentTextId: "t-1-0",
      lastTextId: "t-1-0",
      recentTextIds: ["t-1-0"],
    };
    const next = pickNext(profile, corpus, rng);
    assert.notEqual(next.id, "t-1-0");
  });

  it("prefers the working level", () => {
    const profile = { ...createProfile("Ava", "phrases", []), level: STARTING_LEVEL.phrases };
    const next = pickNext(profile, corpus, seedRng(9));
    assert.equal(next.level, STARTING_LEVEL.phrases);
  });

  it("stays on a letter level until every sound has been seen", () => {
    let profile = createProfile("Ava", "letters", []);
    const seen = new Set<string>();
    for (let i = 0; i < 8; i += 1) {
      const next = pickNext(profile, corpus, seedRng(i + 3));
      assert.equal(next.level, 1);
      seen.add(next.id);
      profile = score(profile, next.id, "right");
    }
    assert.equal(seen.size, 8);
  });

  it("prefers unseen letter sounds over repeats", () => {
    const profile = score(createProfile("Ava", "letters", []), "t-1-0", "right");
    const seen = new Set<string>();
    let current = profile;
    for (let i = 0; i < 7; i += 1) {
      const next = pickNext(current, corpus, seedRng(20 + i));
      assert.notEqual(next.id, "t-1-0");
      assert.equal(seen.has(next.id), false);
      seen.add(next.id);
      current = score(current, next.id, "right");
    }
  });
});

describe("applyResult", () => {
  it("records skip without changing level or weights", () => {
    const profile = createProfile("Ava", "letters", []);
    const text = byId["t-1-0"];
    const next = applyResult(profile, text, "skip", seedRng(1), new Date(), corpus);
    assert.equal(next.level, profile.level);
    assert.equal(next.correctStreak, 0);
    assert.equal(next.wrongStreak, 0);
    assert.equal(next.textStats[text.id].skip, 1);
    assert.equal(textWeight(next.textStats[text.id]), 1);
    assert.equal(next.events[0].result, "skip");
  });

  it("makes a text less likely after a correct read and retires it after enough corrects", () => {
    const text = byId["t-1-1"];
    let profile = createProfile("Ava", "letters", []);
    const startWeight = 1;
    profile = applyResult(profile, text, "right", seedRng(1), new Date(), corpus);
    assert.ok(textWeight(profile.textStats[text.id]) < startWeight);
    profile = applyResult(profile, text, "right", seedRng(1), new Date(), corpus);
    profile = applyResult(profile, text, "right", seedRng(1), new Date(), corpus);
    assert.equal(profile.textStats[text.id].retired, true);
    assert.equal(profile.textStats[text.id].correct, ALGORITHM.retireCorrectCount);
  });

  it("does not leave a letter level until every sound is mastered, even after a long streak", () => {
    let profile = createProfile("Ava", "letters", []);
    for (let i = 0; i < ALGORITHM.levelUpStreak; i += 1) {
      profile = score(profile, `t-1-${i % 4}`, "right");
    }
    assert.equal(profile.level, 1);
    assert.ok(profile.correctStreak >= ALGORITHM.levelUpStreak);
  });

  it("levels up letters only after every sound is seen and the slow streak is met", () => {
    let profile = createProfile("Ava", "letters", []);
    for (let i = 0; i < 8; i += 1) {
      profile = score(profile, `t-1-${i}`, "right");
    }
    assert.equal(profile.level, 1);
    const remaining = ALGORITHM.levelUpStreak - profile.correctStreak;
    for (let i = 0; i < remaining; i += 1) {
      profile = score(profile, `t-1-${i % 8}`, "right");
    }
    assert.equal(profile.level, 2);
    assert.equal(profile.correctStreak, 0);
  });

  it("increases a word level after enough consecutive correct reads without covering the whole level", () => {
    let profile = { ...createProfile("Ava", "words", []), level: 12, boostLevel: 12 };
    for (let i = 0; i < ALGORITHM.levelUpStreak; i += 1) {
      profile = score(profile, `t-12-${i % 3}`, "right");
    }
    assert.equal(profile.level, 13);
    assert.equal(profile.correctStreak, 0);
  });

  it("makes a wrong word more likely, but not immediately", () => {
    const text = byId["t-12-2"];
    let profile = { ...createProfile("Ava", "words", []), level: 12, boostLevel: 12 };
    profile = applyResult(profile, text, "wrong", seedRng(4), new Date(), corpus);
    assert.ok(textWeight(profile.textStats[text.id]) > 1);
    assert.ok(profile.textStats[text.id].cooldown >= ALGORITHM.wrongCooldownMin);
    const next = pickNext(profile, corpus, seedRng(4));
    assert.notEqual(next.id, text.id);
  });

  it("keeps the level after consecutive wrongs", () => {
    let profile = { ...createProfile("Ava", "phrases", []), level: STARTING_LEVEL.phrases };
    for (let i = 0; i < 3; i += 1) {
      profile = applyResult(profile, byId[`t-${STARTING_LEVEL.phrases}-${i}`], "wrong", seedRng(6), new Date(), corpus);
    }
    assert.equal(profile.level, STARTING_LEVEL.phrases);
    assert.equal(profile.wrongStreak, 3);
  });

  it("does not immediately repeat a missed letter", () => {
    let profile = createProfile("Ava", "letters", []);
    profile = score(profile, "t-1-0", "wrong");
    assert.equal(profile.level, 1);
    const next = pickNext(profile, corpus, seedRng(5));
    assert.notEqual(next.id, "t-1-0");
  });

  it("returns a missed letter after another prompt so its picture can come back", () => {
    let profile = createProfile("Ava", "letters", []);
    profile = score(profile, "t-1-0", "wrong");
    const other = pickNext(profile, corpus, seedRng(5));
    assert.notEqual(other.id, "t-1-0");
    profile = score(profile, other.id, "right");
    const next = pickNext(profile, corpus, seedRng(5));
    assert.equal(next.id, "t-1-0");
  });

  it("picks easier mastered text after a wrong without lowering the level", () => {
    let profile = { ...createProfile("Ava", "words", []), level: 19, boostLevel: 19 };
    for (let i = 0; i < 8; i += 1) {
      profile = score(profile, `t-19-${i}`, "right");
    }
    profile = { ...profile, level: 20, boostLevel: 20, currentTextId: null };
    profile = score(profile, "t-20-0", "wrong");
    assert.equal(profile.level, 20);
    const next = pickNext(profile, corpus, seedRng(7));
    assert.equal(next.level, 19);
    assert.notEqual(next.id, "t-20-0");
  });

  it("does not jump letter levels on way too easy", () => {
    let profile = createProfile("Ava", "letters", []);
    profile = recordAndPickNext(profile, byId["t-1-0"], "wayTooEasy", corpus, seedRng(8));
    assert.equal(profile.boostActive, false);
    assert.equal(profile.level, 1);
    assert.equal(byId[profile.currentTextId!].level, 1);
  });

  it("jumps multiple levels on way too easy once the student is in words", () => {
    let profile = {
      ...createProfile("Ava", "words", []),
      level: STARTING_LEVEL.words,
      boostLevel: STARTING_LEVEL.words,
    };
    const first = byId[`t-${STARTING_LEVEL.words}-0`];
    profile = recordAndPickNext(profile, first, "wayTooEasy", corpus, seedRng(8));
    assert.equal(profile.boostActive, true);
    assert.equal(profile.boostLevel, STARTING_LEVEL.words + ALGORITHM.easyJump);
    assert.ok(profile.currentTextId);
    const boosted = byId[profile.currentTextId!];
    assert.equal(boosted.level, STARTING_LEVEL.words + ALGORITHM.easyJump);

    profile = recordAndPickNext(profile, boosted, "right", corpus, seedRng(8));
    assert.equal(profile.boostActive, true);
    const again = byId[profile.currentTextId!];
    assert.equal(again.level, STARTING_LEVEL.words + ALGORITHM.easyJump);
  });

  it("sets the higher level after enough correct boosted reads", () => {
    let profile = {
      ...createProfile("Ava", "words", []),
      level: STARTING_LEVEL.words,
      boostLevel: STARTING_LEVEL.words,
    };
    const jump = STARTING_LEVEL.words + ALGORITHM.easyJump;
    profile = applyResult(profile, byId[`t-${STARTING_LEVEL.words}-0`], "wayTooEasy", seedRng(11), new Date(), corpus);
    for (let i = 0; i < ALGORITHM.levelUpStreak; i += 1) {
      profile = applyResult(profile, byId[`t-${jump}-${i % 8}`], "right", seedRng(11), new Date(), corpus);
    }
    assert.equal(profile.level, jump + 1);
    assert.equal(profile.boostActive, false);
  });

  it("leaves boost on a wrong without dropping the original level", () => {
    let profile = {
      ...createProfile("Ava", "words", []),
      level: STARTING_LEVEL.words,
      boostLevel: STARTING_LEVEL.words,
    };
    profile = applyResult(profile, byId[`t-${STARTING_LEVEL.words}-0`], "wayTooEasy", seedRng(12), new Date(), corpus);
    profile = applyResult(
      profile,
      byId[`t-${STARTING_LEVEL.words + ALGORITHM.easyJump}-0`],
      "wrong",
      seedRng(12),
      new Date(),
      corpus,
    );
    assert.equal(profile.boostActive, false);
    assert.equal(profile.level, STARTING_LEVEL.words);
  });
});
