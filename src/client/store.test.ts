import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STARTING_LEVEL } from "../shared/algorithm.js";
import { memoryStorage, parseAppDataJson } from "../shared/storage.js";
import { APP_VERSION, STORAGE_KEY } from "../shared/type.app.js";
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

  it("imports a shared profile as current without keeping its id", () => {
    const source = new AppStore(memoryStorage());
    source.createFirstProfile("Ava", "words");
    const shared = source.currentProfile!;
    const target = new AppStore(memoryStorage());
    target.createFirstProfile("Old", "phrases");
    const imported = target.importSharedProfile(shared);
    assert.equal(target.state.profiles.length, 2);
    assert.equal(imported.name, "Ava");
    assert.notEqual(imported.id, shared.id);
    assert.equal(target.currentProfile?.id, imported.id);
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

  it("sets an exact profile level and picks a matching prompt", () => {
    const store = new AppStore(memoryStorage());
    store.createFirstProfile("Ava", "words");
    const id = store.currentProfile!.id;
    store.setProfileLevel(id, 4);
    assert.equal(store.currentProfile?.level, 4);
    assert.equal(store.currentProfile?.boostActive, false);
    assert.equal(store.currentText?.level, 4);
  });

  it("migrates v1 word levels onto the squeezed 11-100 scale", () => {
    const storage = memoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        passcode: null,
        currentProfileId: "p1",
        profiles: [
          {
            id: "p1",
            name: "Ava",
            colorPairIndex: 0,
            primaryColor: "#5BA4E8",
            secondaryColor: "#CDE6F7",
            band: "words",
            level: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            currentTextId: "old",
            lastTextId: "old",
            recentTextIds: ["old"],
            boostActive: false,
            boostLevel: 1,
            correctStreak: 0,
            wrongStreak: 0,
            textStats: {},
            events: [],
          },
        ],
      }),
    );
    const store = new AppStore(storage);
    assert.equal(store.currentProfile?.level, STARTING_LEVEL.words);
    assert.equal(store.state.version, APP_VERSION);
    assert.notEqual(store.currentProfile?.currentTextId, "old");
  });
});
