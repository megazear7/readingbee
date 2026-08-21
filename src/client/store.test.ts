import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STARTING_LEVEL } from "../shared/algorithm.js";
import { memoryStorage, parseAppDataJson } from "../shared/storage.js";
import { AppStore } from "./store.js";

describe("AppStore", () => {
  it("onboards, scores, and advances the prompt", () => {
    const store = new AppStore(memoryStorage());
    store.createFirstProfile("Ava", "words");
    assert.equal(store.currentProfile?.name, "Ava");
    assert.equal(store.currentProfile?.level, STARTING_LEVEL.words);
    const first = store.currentText?.id;
    assert.ok(first);
    store.record("right");
    assert.notEqual(store.currentText?.id, first);
    assert.equal(store.currentProfile?.events[0]?.result, "right");
  });

  it("keeps skip from changing level", () => {
    const store = new AppStore(memoryStorage());
    store.createFirstProfile("Ava", "phrases");
    const level = store.currentProfile!.level;
    store.record("skip");
    assert.equal(store.currentProfile?.level, level);
    assert.equal(store.currentProfile?.events[0]?.result, "skip");
  });

  it("exports, switches, and wipes data", () => {
    const storage = memoryStorage();
    const store = new AppStore(storage);
    store.createFirstProfile("Ava", "words");
    const second = store.addProfile("Max", "sentences");
    assert.equal(store.state.profiles.length, 2);
    assert.equal(second.level, STARTING_LEVEL.sentences);
    store.setPasscode("2468");
    assert.equal(store.verifyPasscode("2468"), true);
    assert.equal(store.switchProfile(second.id), true);
    assert.equal(store.currentProfile?.name, "Max");
    const exported = JSON.parse(store.exportJson()) as { profiles: unknown[] };
    assert.equal(exported.profiles.length, 2);
    store.wipeAll();
    assert.equal(store.state.profiles.length, 0);
    assert.equal(store.currentProfile, null);
  });

  it("keeps instructor unlock in memory until wipe", () => {
    const store = new AppStore(memoryStorage());
    store.createFirstProfile("Ava", "words");
    store.setPasscode("1234");
    assert.equal(store.instructorUnlocked, false);
    store.unlockInstructor();
    assert.equal(store.instructorUnlocked, true);
    store.addProfile("Max", "sentences");
    assert.equal(store.instructorUnlocked, true);
    store.wipeAll();
    assert.equal(store.instructorUnlocked, false);
  });

  it("replaces all data on import", () => {
    const source = new AppStore(memoryStorage());
    source.createFirstProfile("Ava", "words");
    source.addProfile("Max", "books");
    source.setPasscode("1357");
    const exported = source.exportJson();

    const target = new AppStore(memoryStorage());
    target.createFirstProfile("Old", "phrases");
    target.importState(parseAppDataJson(exported));
    assert.equal(target.state.profiles.length, 2);
    assert.equal(target.state.profiles[0]?.name, "Ava");
    assert.equal(target.verifyPasscode("1357"), true);
  });
});
