export type ShopItem = {
  id: string;
  name: string;
  cost: number;
  image: string;
};

const item = (id: string, name: string, cost: number): ShopItem => ({
  id,
  name,
  cost,
  image: `/shop/${id}.webp`,
});

export const SHOP_ITEMS: ShopItem[] = [
  item("sticker", "Sticker", 1),
  item("hat", "Hat", 2),
  item("baseball-bat", "Baseball bat", 3),
  item("gloves", "Gloves", 4),
  item("football", "Football", 5),
  item("crayon", "Crayon", 6),
  item("balloon", "Balloon", 7),
  item("jump-rope", "Jump rope", 8),
  item("yoyo", "Yo-yo", 9),
  item("sword", "Sword", 10),
  item("book", "Book", 11),
  item("paintbrush", "Paintbrush", 12),
  item("scooter", "Scooter", 13),
  item("telescope", "Telescope", 14),
  item("magic-wand", "Magic wand", 15),
  item("soccer-ball", "Soccer ball", 16),
  item("backpack", "Backpack", 17),
  item("bicycle", "Bicycle", 18),
  item("skateboard", "Skateboard", 19),
  item("kitten", "Pet kitten", 20),
  item("puppy", "Pet puppy", 21),
  item("drum", "Drum", 22),
  item("guitar", "Guitar", 23),
  item("microphone", "Microphone", 24),
  item("camera", "Camera", 25),
  item("compass", "Compass", 26),
  item("treasure-map", "Treasure map", 27),
  item("pirate-hat", "Pirate hat", 28),
  item("shield", "Shield", 29),
  item("bow", "Bow and arrow", 30),
  item("robot", "Robot toy", 31),
  item("spaceship", "Spaceship", 32),
  item("rocket", "Rocket", 33),
  item("star", "Star", 34),
  item("moon-lamp", "Moon lamp", 35),
  item("rainbow", "Rainbow", 36),
  item("unicorn", "Unicorn", 37),
  item("fairy-wings", "Fairy wings", 38),
  item("crown", "Crown", 39),
  item("house", "House", 40),
  item("treehouse", "Treehouse", 41),
  item("tent", "Tent", 42),
  item("campfire", "Campfire", 43),
  item("canoe", "Canoe", 44),
  item("surfboard", "Surfboard", 45),
  item("ice-cream", "Ice cream", 46),
  item("cake", "Cake", 47),
  item("pizza", "Pizza", 48),
  item("cookie", "Cookie", 49),
  item("honey-pot", "Honey pot", 50),
  item("bouquet", "Flower bouquet", 51),
  item("garden", "Garden", 52),
  item("butterfly", "Butterfly", 53),
  item("ladybug", "Ladybug", 54),
  item("goldfish", "Goldfish", 55),
  item("parrot", "Parrot", 56),
  item("bunny", "Bunny", 57),
  item("pony", "Pony", 58),
  item("owl", "Owl", 59),
];

export const shopItemById = (id: string): ShopItem | undefined => SHOP_ITEMS.find((item) => item.id === id);

export const SHOP_COLUMNS = 3;
export const SHOP_MIN_VISIBLE_ROWS = 3;

export const visibleShopCount = (coinsEarned: number): number => {
  const minVisible = SHOP_COLUMNS * SHOP_MIN_VISIBLE_ROWS;
  const unlocked = SHOP_ITEMS.filter((item) => item.cost < coinsEarned / 2).length;
  const count = Math.max(minVisible, unlocked);
  const rows = Math.ceil(count / SHOP_COLUMNS) * SHOP_COLUMNS;
  return Math.min(SHOP_ITEMS.length, rows);
};

export const lifetimeCoins = (coins: number, inventory: string[], coinsEarned = 0): number => {
  const spent = inventory.reduce((sum, id) => sum + (shopItemById(id)?.cost ?? 0), 0);
  return Math.max(coinsEarned, coins + spent);
};

export const shopTeaseCount = (coinsEarned: number): number => {
  const reveal = visibleShopCount(coinsEarned);
  return Math.min(SHOP_ITEMS.length, reveal + SHOP_COLUMNS * 3);
};

export const hiddenShopRow = (index: number, reveal: number): 0 | 1 | 2 | null => {
  if (index < reveal) return null;
  const row = Math.floor((index - reveal) / SHOP_COLUMNS);
  if (row < 0 || row > 2) return null;
  return row as 0 | 1 | 2;
};
