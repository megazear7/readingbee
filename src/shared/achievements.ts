import { Profile } from "./type.app.js";

export type Achievement = {
  id: string;
  family: string;
  number: number;
  title: string;
  description: string;
  earned: (profile: Profile) => boolean;
};

const retiredCount = (profile: Profile): number => {
  return Object.values(profile.textStats).filter((stat) => stat.retired).length;
};

const rightCount = (profile: Profile): number => {
  return Object.values(profile.textStats).reduce((sum, stat) => sum + stat.correct, 0);
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "streak-5",
    family: "streak",
    number: 5,
    title: "5 in a row",
    description: "Get 5 right in a row",
    earned: (profile) => profile.maxCorrectStreak >= 5,
  },
  {
    id: "streak-10",
    family: "streak",
    number: 10,
    title: "10 in a row",
    description: "Get 10 right in a row",
    earned: (profile) => profile.maxCorrectStreak >= 10,
  },
  {
    id: "streak-20",
    family: "streak",
    number: 20,
    title: "20 in a row",
    description: "Get 20 right in a row",
    earned: (profile) => profile.maxCorrectStreak >= 20,
  },
  {
    id: "shop-3",
    family: "shop",
    number: 3,
    title: "Buy 3 items",
    description: "Buy 3 shop rewards",
    earned: (profile) => profile.inventory.length >= 3,
  },
  {
    id: "shop-10",
    family: "shop",
    number: 10,
    title: "Buy 10 items",
    description: "Buy 10 shop rewards",
    earned: (profile) => profile.inventory.length >= 10,
  },
  {
    id: "shop-20",
    family: "shop",
    number: 20,
    title: "Buy 20 items",
    description: "Buy 20 shop rewards",
    earned: (profile) => profile.inventory.length >= 20,
  },
  {
    id: "bank-20",
    family: "bank",
    number: 20,
    title: "20 in the bank",
    description: "Have 20 coins at once",
    earned: (profile) => profile.peakCoins >= 20,
  },
  {
    id: "bank-50",
    family: "bank",
    number: 50,
    title: "50 in the bank",
    description: "Have 50 coins at once",
    earned: (profile) => profile.peakCoins >= 50,
  },
  {
    id: "bank-100",
    family: "bank",
    number: 100,
    title: "100 in the bank",
    description: "Have 100 coins at once",
    earned: (profile) => profile.peakCoins >= 100,
  },
  {
    id: "earned-25",
    family: "earned",
    number: 25,
    title: "Earn 25 coins",
    description: "Earn 25 coins in all",
    earned: (profile) => profile.coinsEarned >= 25,
  },
  {
    id: "earned-100",
    family: "earned",
    number: 100,
    title: "Earn 100 coins",
    description: "Earn 100 coins in all",
    earned: (profile) => profile.coinsEarned >= 100,
  },
  {
    id: "earned-250",
    family: "earned",
    number: 250,
    title: "Earn 250 coins",
    description: "Earn 250 coins in all",
    earned: (profile) => profile.coinsEarned >= 250,
  },
  {
    id: "level-5",
    family: "level",
    number: 5,
    title: "Level 5",
    description: "Reach reading level 5",
    earned: (profile) => profile.level >= 5,
  },
  {
    id: "level-20",
    family: "level",
    number: 20,
    title: "Level 20",
    description: "Reach reading level 20",
    earned: (profile) => profile.level >= 20,
  },
  {
    id: "level-50",
    family: "level",
    number: 50,
    title: "Level 50",
    description: "Reach reading level 50",
    earned: (profile) => profile.level >= 50,
  },
  {
    id: "read-10",
    family: "read",
    number: 10,
    title: "10 right",
    description: "Get 10 answers right",
    earned: (profile) => rightCount(profile) >= 10,
  },
  {
    id: "read-50",
    family: "read",
    number: 50,
    title: "50 right",
    description: "Get 50 answers right",
    earned: (profile) => rightCount(profile) >= 50,
  },
  {
    id: "read-200",
    family: "read",
    number: 200,
    title: "200 right",
    description: "Get 200 answers right",
    earned: (profile) => rightCount(profile) >= 200,
  },
  {
    id: "master-5",
    family: "master",
    number: 5,
    title: "Master 5",
    description: "Master 5 reading texts",
    earned: (profile) => retiredCount(profile) >= 5,
  },
  {
    id: "master-15",
    family: "master",
    number: 15,
    title: "Master 15",
    description: "Master 15 reading texts",
    earned: (profile) => retiredCount(profile) >= 15,
  },
  {
    id: "master-40",
    family: "master",
    number: 40,
    title: "Master 40",
    description: "Master 40 reading texts",
    earned: (profile) => retiredCount(profile) >= 40,
  },
];

export const achievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find((item) => item.id === id);
};

export const earnedAchievementIds = (profile: Profile): string[] => {
  return ACHIEVEMENTS.filter((item) => item.earned(profile)).map((item) => item.id);
};

export const syncAchievements = (profile: Profile): Profile => {
  const peakCoins = Math.max(profile.peakCoins, profile.coins);
  const next = peakCoins === profile.peakCoins ? profile : { ...profile, peakCoins };
  const unlocked = [...new Set([...next.achievements, ...earnedAchievementIds(next)])];
  if (unlocked.length === next.achievements.length && unlocked.every((id) => next.achievements.includes(id))) {
    return next;
  }
  return { ...next, achievements: unlocked };
};

export const newAchievementIds = (previous: string[], next: string[]): string[] => {
  const had = new Set(previous);
  return next.filter((id) => !had.has(id));
};
