import { applyColorPair, createProfile, ensureCurrentText, recordAndPickNext } from "../shared/algorithm.js";
import { corpus, corpusById } from "../shared/corpus.js";
import { clearState, loadState, saveState, StorageLike } from "../shared/storage.js";
import { AppState, PASSCODE_LENGTH, Profile, ReadingBand, ReadingText, ResultKind } from "../shared/type.app.js";
import { createId } from "../shared/util.id.js";

export class AppStore extends EventTarget {
  state: AppState;
  instructorUnlocked = false;
  private readonly storage: StorageLike;

  constructor(storage: StorageLike) {
    super();
    this.storage = storage;
    const loaded = loadState(storage);
    this.state = {
      ...loaded,
      profiles: loaded.profiles.map((profile) => ensureCurrentText(profile, corpus)),
    };
    this.persist();
  }

  get currentProfile(): Profile | null {
    return this.state.profiles.find((profile) => profile.id === this.state.currentProfileId) ?? null;
  }

  get currentText(): ReadingText | null {
    const profile = this.currentProfile;
    if (!profile?.currentTextId) {
      return null;
    }
    return corpusById[profile.currentTextId] ?? null;
  }

  private persist(): void {
    saveState(this.storage, this.state);
    this.dispatchEvent(new Event("change"));
  }

  private replaceProfile(next: Profile): void {
    this.state = {
      ...this.state,
      profiles: this.state.profiles.map((profile) => (profile.id === next.id ? next : profile)),
    };
    this.persist();
  }

  createFirstProfile(name: string, band: ReadingBand): void {
    const profile = ensureCurrentText(createProfile(name, band, []), corpus);
    this.state = {
      ...this.state,
      profiles: [profile],
      currentProfileId: profile.id,
    };
    this.persist();
  }

  addProfile(name: string, band: ReadingBand, colorPairIndex?: number): Profile {
    const used = this.state.profiles.map((profile) => profile.colorPairIndex);
    const profile = ensureCurrentText(createProfile(name, band, used, new Date(), colorPairIndex), corpus);
    this.state = {
      ...this.state,
      profiles: [...this.state.profiles, profile],
    };
    this.persist();
    return profile;
  }

  renameProfile(id: string, name: string): void {
    const profile = this.state.profiles.find((item) => item.id === id);
    if (!profile) return;
    this.replaceProfile({ ...profile, name: name.trim() || profile.name });
  }

  recolorProfile(id: string, colorPairIndex: number): void {
    const profile = this.state.profiles.find((item) => item.id === id);
    if (!profile) return;
    this.replaceProfile(applyColorPair(profile, colorPairIndex));
  }

  removeProfile(id: string): void {
    const profiles = this.state.profiles.filter((profile) => profile.id !== id);
    const currentProfileId =
      this.state.currentProfileId === id ? (profiles[0]?.id ?? null) : this.state.currentProfileId;
    this.state = {
      ...this.state,
      profiles: profiles.map((profile) =>
        profile.id === currentProfileId ? ensureCurrentText(profile, corpus) : profile,
      ),
      currentProfileId,
    };
    this.persist();
  }

  switchProfile(id: string): boolean {
    const profile = this.state.profiles.find((item) => item.id === id);
    if (!profile) return false;
    this.state = {
      ...this.state,
      currentProfileId: id,
      profiles: this.state.profiles.map((item) => (item.id === id ? ensureCurrentText(item, corpus) : item)),
    };
    this.persist();
    return true;
  }

  record(result: ResultKind): void {
    const profile = this.currentProfile;
    const text = this.currentText;
    if (!profile || !text) return;
    this.replaceProfile(recordAndPickNext(profile, text, result, corpus));
  }

  unlockInstructor(): void {
    this.instructorUnlocked = true;
    this.dispatchEvent(new Event("change"));
  }

  hasPasscode(): boolean {
    return Boolean(this.state.passcode);
  }

  verifyPasscode(value: string): boolean {
    return this.state.passcode === value;
  }

  isValidPasscode(value: string): boolean {
    return new RegExp(`^\\d{${PASSCODE_LENGTH}}$`).test(value);
  }

  setPasscode(value: string): boolean {
    if (!this.isValidPasscode(value)) return false;
    this.state = { ...this.state, passcode: value };
    this.persist();
    return true;
  }

  exportJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importSharedProfile(incoming: Profile): Profile {
    const profile = ensureCurrentText({ ...incoming, id: createId() }, corpus);
    this.state = {
      ...this.state,
      profiles: [...this.state.profiles, profile],
      currentProfileId: profile.id,
    };
    this.persist();
    return profile;
  }

  importState(next: AppState): void {
    const profiles = next.profiles.map((profile) => ensureCurrentText(profile, corpus));
    const currentProfileId = profiles.some((profile) => profile.id === next.currentProfileId)
      ? next.currentProfileId
      : (profiles[0]?.id ?? null);
    this.state = {
      ...next,
      profiles,
      currentProfileId,
    };
    this.persist();
  }

  wipeAll(): void {
    this.instructorUnlocked = false;
    clearState(this.storage);
    this.state = loadState(this.storage);
    this.persist();
  }
}

const browserStorage = (): StorageLike => {
  if (typeof localStorage === "undefined") {
    const data = new Map<string, string>();
    return {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
      removeItem: (key) => {
        data.delete(key);
      },
    };
  }
  return localStorage;
};

export const appStore = new AppStore(browserStorage());
