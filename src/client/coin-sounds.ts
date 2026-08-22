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

export const playCoinSounds = (count: number, staggerMs = 70): void => {
  const n = Math.max(0, Math.round(count));
  for (let i = 0; i < n; i += 1) {
    window.setTimeout(() => playCoinSound(), i * staggerMs);
  }
};
