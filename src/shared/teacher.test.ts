import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALGORITHM, createProfile } from "./algorithm.js";
import { formatTeacherDate, teacherSnapshot } from "./teacher.js";
import { MAX_LEVEL } from "./type.app.js";

describe("teacherSnapshot", () => {
  it("shows remaining streak toward the next level", () => {
    const profile = { ...createProfile("Ava", "words", []), correctStreak: 12 };
    const snap = teacherSnapshot(profile, profile.id);
    assert.equal(snap.level, 11);
    assert.equal(snap.nextLevel, 12);
    assert.equal(snap.remaining, ALGORITHM.levelUpStreak - 12);
    assert.equal(snap.headline, `${ALGORITHM.levelUpStreak - 12} more right in a row`);
    assert.equal(snap.figure, String(ALGORITHM.levelUpStreak - 12));
    assert.equal(snap.meters[0]?.value, 12);
    assert.equal(snap.meters[0]?.max, ALGORITHM.levelUpStreak);
    assert.equal(snap.isCurrent, true);
    assert.deepEqual(snap.tags, ["Reading now"]);
  });

  it("explains letter coverage before a level-up", () => {
    const profile = createProfile("Ava", "letters", []);
    const snap = teacherSnapshot(profile);
    assert.match(snap.headline, /sound/);
    assert.equal(snap.meters.length, 2);
    assert.equal(snap.meters[1]?.value, 0);
    assert.ok(snap.remaining > 0);
  });

  it("marks a completed streak as ready to level up", () => {
    const profile = { ...createProfile("Ava", "words", []), correctStreak: ALGORITHM.levelUpStreak };
    const snap = teacherSnapshot(profile);
    assert.equal(snap.headline, "Ready to level up");
    assert.equal(snap.figure, "Ready");
    assert.equal(snap.remaining, 0);
    assert.equal(snap.progressPercent, 100);
  });

  it("keeps recent answers for the teacher", () => {
    const base = createProfile("Ava", "words", []);
    const profile = {
      ...base,
      events: [
        { id: "1", textId: "a", text: "cat", level: 11, result: "right" as const, at: "2026-08-22T11:00:00.000Z" },
        { id: "2", textId: "b", text: "sun", level: 11, result: "wrong" as const, at: "2026-08-22T11:01:00.000Z" },
      ],
    };
    const snap = teacherSnapshot(profile);
    assert.equal(snap.recent[0]?.text, "sun");
    assert.equal(snap.recent[0]?.result, "wrong");
    assert.equal(snap.stats.accuracy, "50%");
  });

  it("treats the top of the path as complete", () => {
    const profile = { ...createProfile("Ava", "books", []), level: MAX_LEVEL, boostActive: false };
    const snap = teacherSnapshot(profile);
    assert.equal(snap.atMaxLevel, true);
    assert.equal(snap.figure, "Max");
    assert.equal(snap.progressPercent, 100);
  });

  it("formats recent activity", () => {
    const now = new Date("2026-08-22T12:00:00.000Z");
    assert.equal(formatTeacherDate(now.toISOString(), now), "Just now");
    assert.equal(formatTeacherDate("2026-08-22T11:10:00.000Z", now), "50 min ago");
  });
});
