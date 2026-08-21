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
import { ReadingText } from "./type.app.js";

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
});

describe("applyResult", () => {
  it("records skip without changing level or weights", () => {
    const profile = createProfile("Ava", "letters", []);
    const text = byId["t-1-0"];
    const next = applyResult(profile, text, "skip", seedRng(1));
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
    profile = applyResult(profile, text, "right", seedRng(1));
    assert.ok(textWeight(profile.textStats[text.id]) < startWeight);
    profile = applyResult(profile, text, "right", seedRng(1));
    profile = applyResult(profile, text, "right", seedRng(1));
    assert.equal(profile.textStats[text.id].retired, true);
    assert.equal(profile.textStats[text.id].correct, ALGORITHM.retireCorrectCount);
  });

  it("increases level after enough consecutive correct reads", () => {
    let profile = createProfile("Ava", "letters", []);
    for (let i = 0; i < ALGORITHM.levelUpStreak; i += 1) {
      const text = byId[`t-1-${i}`];
      profile = applyResult(profile, text, "right", seedRng(2));
    }
    assert.equal(profile.level, 2);
    assert.equal(profile.correctStreak, 0);
  });

  it("makes a wrong text more likely, but not immediately", () => {
    const text = byId["t-1-2"];
    let profile = createProfile("Ava", "letters", []);
    profile = applyResult(profile, text, "wrong", seedRng(4));
    assert.ok(textWeight(profile.textStats[text.id]) > 1);
    assert.ok(profile.textStats[text.id].cooldown >= ALGORITHM.wrongCooldownMin);
    const next = pickNext(profile, corpus, seedRng(4));
    assert.notEqual(next.id, text.id);
  });

  it("drops a level after enough consecutive wrongs", () => {
    let profile = { ...createProfile("Ava", "phrases", []), level: STARTING_LEVEL.phrases };
    for (let i = 0; i < ALGORITHM.levelDownStreak; i += 1) {
      profile = applyResult(profile, byId[`t-${STARTING_LEVEL.phrases}-${i}`], "wrong", seedRng(6));
    }
    assert.equal(profile.level, STARTING_LEVEL.phrases - 1);
  });

  it("jumps multiple levels on way too easy and stays high while correct", () => {
    let profile = createProfile("Ava", "letters", []);
    const first = byId["t-1-0"];
    profile = recordAndPickNext(profile, first, "wayTooEasy", corpus, seedRng(8));
    assert.equal(profile.boostActive, true);
    assert.equal(profile.boostLevel, 1 + ALGORITHM.easyJump);
    assert.ok(profile.currentTextId);
    const boosted = byId[profile.currentTextId!];
    assert.equal(boosted.level, 1 + ALGORITHM.easyJump);

    profile = recordAndPickNext(profile, boosted, "right", corpus, seedRng(8));
    assert.equal(profile.boostActive, true);
    const again = byId[profile.currentTextId!];
    assert.equal(again.level, 1 + ALGORITHM.easyJump);
  });

  it("sets the higher level after enough correct boosted reads", () => {
    let profile = createProfile("Ava", "letters", []);
    profile = applyResult(profile, byId["t-1-0"], "wayTooEasy", seedRng(11));
    for (let i = 0; i < ALGORITHM.levelUpStreak; i += 1) {
      profile = applyResult(profile, byId[`t-9-${i}`], "right", seedRng(11));
    }
    assert.equal(profile.level, 1 + ALGORITHM.easyJump + 1);
    assert.equal(profile.boostActive, false);
  });

  it("leaves boost on a wrong without dropping the original level", () => {
    let profile = createProfile("Ava", "letters", []);
    profile = applyResult(profile, byId["t-1-0"], "wayTooEasy", seedRng(12));
    profile = applyResult(profile, byId["t-9-0"], "wrong", seedRng(12));
    assert.equal(profile.boostActive, false);
    assert.equal(profile.level, 1);
  });
});
