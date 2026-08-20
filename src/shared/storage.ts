import { AppState, emptyAppState, STORAGE_KEY } from "./type.app.js";

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

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

export const loadState = (storage: StorageLike): AppState => {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyAppState();
  }
  try {
    return AppState.parse(JSON.parse(raw));
  } catch {
    return emptyAppState();
  }
};

export const saveState = (storage: StorageLike, state: AppState): void => {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = (storage: StorageLike): void => {
  storage.removeItem(STORAGE_KEY);
};
