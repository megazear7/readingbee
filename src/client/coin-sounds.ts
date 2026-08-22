export const COIN_SOUNDS = [
  "/sounds/Coin01.mp3",
  "/sounds/Coin02.mp3",
  "/sounds/Coin03.mp3",
  "/sounds/Coin04.mp3",
  "/sounds/Coin05.mp3",
];

export const playCoinSound = (): void => {
  const src = COIN_SOUNDS[Math.floor(Math.random() * COIN_SOUNDS.length)];
  const audio = new Audio(src);
  audio.volume = 0.45;
  void audio.play().catch(() => undefined);
};

export const coinAppearWindow = (count: number): number => {
  const n = Math.max(0, Math.round(count));
  if (n <= 1) return 0;
  if (n <= 5) return 2;
  if (n <= 15) return 3;
  return 4;
};

export const playCoinSounds = (count: number, staggerMs?: number): void => {
  const n = Math.max(0, Math.round(count));
  const gap = staggerMs ?? (n <= 1 ? 0 : (coinAppearWindow(n) * 1000) / (n - 1));
  for (let i = 0; i < n; i += 1) {
    window.setTimeout(() => playCoinSound(), i * gap);
  }
};
