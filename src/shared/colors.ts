export type ColorPair = {
  primary: string;
  secondary: string;
};

export const COLOR_PAIRS: ColorPair[] = [
  { primary: "#E8B84A", secondary: "#F4E6C3" },
  { primary: "#E36B5B", secondary: "#F6C7B8" },
  { primary: "#5BA4E8", secondary: "#CDE6F7" },
  { primary: "#8B6CE0", secondary: "#D9C8F7" },
  { primary: "#3CB98A", secondary: "#BBEBD4" },
  { primary: "#E45CA8", secondary: "#F7C5E0" },
  { primary: "#2EB5C0", secondary: "#B6ECF0" },
  { primary: "#F08A3A", secondary: "#F8D2B0" },
  { primary: "#4C6FE0", secondary: "#C5D2F7" },
  { primary: "#D95F7A", secondary: "#F4C4CE" },
  { primary: "#A8C94A", secondary: "#E2F0B4" },
  { primary: "#C94B4B", secondary: "#F0C0C0" },
  { primary: "#3E8EDE", secondary: "#B9D8F6" },
  { primary: "#D4A017", secondary: "#F3E2A4" },
  { primary: "#4E9A6E", secondary: "#C4E6D1" },
  { primary: "#C45ED4", secondary: "#EBC4F2" },
  { primary: "#2FA8A0", secondary: "#B7E8E3" },
  { primary: "#A34B6B", secondary: "#E8C2D0" },
  { primary: "#4A67C7", secondary: "#C3CEF0" },
  { primary: "#B57A3C", secondary: "#EBD3B3" },
];

export const nextColorPairIndex = (usedIndexes: number[]): number => {
  const used = new Set(usedIndexes);
  for (let i = 0; i < COLOR_PAIRS.length; i += 1) {
    if (!used.has(i)) {
      return i;
    }
  }
  return usedIndexes.length % COLOR_PAIRS.length;
};

export const colorPairAt = (index: number): ColorPair => {
  const safe = ((index % COLOR_PAIRS.length) + COLOR_PAIRS.length) % COLOR_PAIRS.length;
  return COLOR_PAIRS[safe] ?? COLOR_PAIRS[0];
};
