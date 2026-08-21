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
  { primary: "#E15B8A", secondary: "#F5C5D4" },
  { primary: "#6B8F3A", secondary: "#D4E6B5" },
  { primary: "#C47A2C", secondary: "#F0D4A8" },
  { primary: "#5C8C8C", secondary: "#C5DEDE" },
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

const LIGHT_TEXT = "#F4EAD5";
const DARK_TEXT = "#1A1408";

const parseHex = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "").trim();
  const full =
    value.length === 3
      ? value
          .split("")
          .map((part) => part + part)
          .join("")
      : value;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
};

const channel = (value: number): number => {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string): number => {
  const [red, green, blue] = parseHex(hex);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
};

const contrastRatio = (first: string, second: string): number => {
  const a = luminance(first);
  const b = luminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
};

export const readableTextColor = (primary: string, secondary: string): string => {
  const minLight = Math.min(contrastRatio(LIGHT_TEXT, primary), contrastRatio(LIGHT_TEXT, secondary));
  const minDark = Math.min(contrastRatio(DARK_TEXT, primary), contrastRatio(DARK_TEXT, secondary));
  return minLight >= minDark ? LIGHT_TEXT : DARK_TEXT;
};

export const profileInitial = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toLocaleUpperCase();
};

export const avatarStyle = (primary: string, secondary: string): string => {
  return `background: linear-gradient(135deg, ${primary} 0 50%, ${secondary} 50% 100%); color: ${readableTextColor(primary, secondary)};`;
};
