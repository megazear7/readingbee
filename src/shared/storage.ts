import { migrateProfileFromV1 } from "./algorithm.js";
import { APP_VERSION, AppState, emptyAppState, Profile, STORAGE_KEY } from "./type.app.js";
import z from "zod";

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const PersistedState = z.object({
  version: z.number().int(),
  passcode: z.string().nullable(),
  currentProfileId: z.string().nullable(),
  profiles: z.array(Profile),
});

export const memoryStorage = (): StorageLike => {
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
};

export const migrateState = (raw: unknown): AppState => {
  const loose = PersistedState.parse(raw);
  const profiles = loose.version < 2 ? loose.profiles.map(migrateProfileFromV1) : loose.profiles;
  return AppState.parse({
    ...loose,
    version: APP_VERSION,
    profiles,
  });
};

export const loadState = (storage: StorageLike): AppState => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyAppState();
  }
  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return emptyAppState();
  }
};

export const parseAppDataJson = (raw: string): AppState => {
  return migrateState(JSON.parse(raw));
};

export const saveState = (storage: StorageLike, state: AppState): void => {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = (storage: StorageLike): void => {
  storage.removeItem(STORAGE_KEY);
};
