import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const letters = {
  1: ["a", "t", "s", "i", "p", "n", "m", "d", "g", "o"],
  2: ["c", "k", "e", "u", "r", "h", "b", "f", "l", "j"],
  3: ["v", "w", "x", "y", "z", "q", "qu", "ck", "ff", "ll"],
  4: ["sh", "ch", "th", "wh", "ph", "ng", "nk", "ss", "zz", "tch"],
  5: ["bl", "cl", "fl", "gl", "pl", "sl", "sc", "sk", "sm", "sn"],
  6: ["br", "cr", "dr", "fr", "gr", "pr", "tr", "tw", "sw", "st"],
  7: ["sp", "str", "spr", "spl", "scr", "shr", "thr", "squ", "nd", "nt"],
  8: ["ai", "ay", "ee", "ea", "oa", "ow", "oe", "ie", "igh", "ue"],
  9: ["ew", "oo", "ou", "oi", "oy", "au", "aw", "ui", "ey", "eigh"],
  10: ["ar", "or", "er", "ir", "ur", "air", "ear", "ore", "ure", "oor"],
};

const words = {
  1: ["cat", "hat", "sat", "mat", "bat", "rat", "pat", "a", "I", "at"],
  2: ["dog", "hog", "log", "fog", "mom", "pop", "hop", "top", "mop", "pot"],
  3: ["pig", "big", "dig", "wig", "sit", "hit", "bit", "kit", "lit", "it"],
  4: ["sun", "run", "fun", "bun", "cup", "pup", "up", "bug", "hug", "mug"],
  5: ["red", "bed", "fed", "hen", "pen", "ten", "net", "wet", "pet", "let"],
  6: ["man", "can", "pan", "ran", "van", "cap", "map", "nap", "jam", "ham"],
  7: ["see", "me", "we", "he", "she", "go", "no", "so", "my", "by"],
  8: ["the", "and", "you", "is", "in", "on", "to", "do", "yes", "not"],
  9: ["box", "fox", "six", "mix", "fix", "zip", "lip", "sip", "tip", "dip"],
  10: ["ship", "shop", "fish", "wish", "cash", "dash", "shut", "chin", "chip", "chat"],
  11: ["frog", "flag", "clap", "slip", "sled", "stop", "spot", "spin", "crab", "drum"],
  12: ["tree", "bee", "see", "feet", "seed", "keep", "green", "sleep", "three", "sheep"],
  13: ["rain", "sail", "mail", "pain", "wait", "day", "play", "say", "way", "may"],
  14: ["boat", "coat", "road", "toad", "soap", "oak", "low", "show", "grow", "snow"],
  15: ["bird", "girl", "turn", "hurt", "fur", "her", "were", "first", "dirt", "burn"],
  16: ["cake", "make", "take", "name", "game", "came", "lake", "gate", "late", "same"],
  17: ["bike", "like", "time", "ride", "hide", "kite", "five", "nine", "line", "mine"],
  18: ["home", "bone", "nose", "rose", "hope", "rope", "note", "joke", "hole", "cone"],
  19: ["jump", "just", "hand", "land", "sand", "fast", "last", "best", "nest", "help"],
  20: ["little", "yellow", "purple", "orange", "after", "under", "over", "water", "happy", "funny"],
};

const phraseSets = {
  21: ["a cat", "the hat", "my dog", "a sun", "the cup", "my mom", "a bug", "the hen", "my dad", "a fox"],
  22: ["the cat", "a big dog", "my red hat", "the wet hen", "a hot sun", "the tan pup", "my old map", "a fat pig", "the sad man", "my new pen"],
  23: ["I see", "we go", "you sit", "he ran", "she sat", "I hop", "we run", "you can", "he hid", "she won"],
  24: ["big cat", "red hat", "hot sun", "wet dog", "sad hen", "fun pig", "old box", "new cup", "tan fox", "bad bug"],
  25: ["the red cat", "a big dog", "my tan hat", "the hot sun", "a wet log", "my fun map", "the old van", "a new bed", "the fat hen", "my sad pup"],
  26: ["I see it", "we can go", "you did it", "he can run", "she can hop", "I like it", "we see you", "you can sit", "he is up", "she is in"],
  27: ["on the mat", "in the box", "up the hill", "by the bed", "to the van", "in my cup", "on my hat", "by the log", "in the sun", "to the shop"],
  28: ["a red ball", "the big bus", "my old book", "a tan duck", "the wet frog", "my fun kite", "a hot cake", "the sad bird", "my new bike", "a fast ant"],
  29: ["look at me", "come with us", "go to bed", "sit with me", "run to mom", "jump with dad", "play with me", "look at it", "come and see", "go and play"],
  30: ["the little cat", "a funny dog", "my yellow hat", "the purple cup", "a happy hen", "my orange ball", "the little pig", "a funny bug", "my happy pup", "the yellow sun"],
  31: ["I see a cat", "we like the dog", "you have a hat", "he has a cup", "she has a pen", "I want a book", "we have a ball", "you like the sun", "he likes the pig", "she likes the hen"],
  32: ["the cat sat down", "a dog ran off", "my hat is red", "the sun is hot", "a bug is on it", "my mom can help", "the hen is wet", "a fox is fast", "my dad is here", "the pig is big"],
  33: ["look at the cat", "come to the van", "go up the hill", "sit on the mat", "run to the shop", "jump on the bed", "play in the sun", "look in the box", "come and see it", "go with my mom"],
  34: ["a cat and a dog", "the hen and the pig", "my hat and my cup", "the sun and the fog", "a bug and a bee", "my mom and my dad", "the box and the lid", "a fish and a frog", "my book and my pen", "the bus and the van"],
  35: ["I can see it now", "we can go with you", "you can sit by me", "he can run so fast", "she can hop so high", "I can help my mom", "we can play at home", "you can look at this", "he can find the cat", "she can make a cake"],
  36: ["the big red ball", "a little tan dog", "my old yellow hat", "the hot white sun", "a funny little bug", "my new green book", "the wet brown log", "a fast black ant", "my big blue cup", "the sad little hen"],
  37: ["up on the hill", "down in the pond", "out in the rain", "back to the barn", "over the log", "under the bed", "into the shop", "out of the box", "along the path", "across the yard"],
  38: ["let us go now", "come and see this", "look at that dog", "here is my hat", "this is the sun", "that is a bug", "here comes the bus", "this is my book", "that is my mom", "here is a cake"],
  39: ["the cat is on the mat", "a dog is in the van", "my hat is on the bed", "the sun is in the sky", "a bug is on the log", "my cup is on the map", "the hen is in the nest", "a fox is in the box", "my pen is in the bag", "the pig is in the mud"],
  40: ["I see the little cat", "we like the funny dog", "you have a yellow hat", "he has a green book", "she has a red ball", "I want the blue cup", "we have a happy pup", "you like the hot sun", "he likes the wet frog", "she likes the tan hen"],
};

const names = [
  "Sam", "Mia", "Ben", "Ava", "Leo", "Zoe", "Max", "Ivy", "Eli", "Ana",
  "Ned", "Kim", "Owen", "Lila", "Tess", "Nia", "Cal", "Jude", "Remy", "Pia",
];
const nouns = [
  "cat", "dog", "hen", "pig", "fox", "bug", "bee", "duck", "frog", "bird",
  "pup", "ant", "fish", "bat", "goat", "lamb", "cub", "colt", "swan", "moth",
];
const adjs = [
  "big", "red", "tan", "sad", "wet", "hot", "fun", "old", "new", "fast",
  "soft", "little", "happy", "funny", "kind", "calm", "brave", "quiet", "warm", "cool",
];
const verbs = [
  "ran", "sat", "hid", "hopped", "jumped", "looked", "played", "went", "came", "saw",
  "liked", "found", "helped", "made", "got", "held", "fed", "sang", "rested", "walked",
];
const places = [
  "mat", "bed", "rug", "hill", "park", "pond", "nest", "tree", "path", "barn",
  "yard", "shop", "bus", "van", "home", "lake", "gate", "porch", "sand", "dock",
];

const take = (list, n) => {
  const item = list[n % list.length];
  return { item, next: Math.floor(n / list.length) };
};

const sentenceAt = (n) => {
  const name = take(names, n);
  const noun = take(nouns, name.next);
  const adj = take(adjs, noun.next);
  const verb = take(verbs, adj.next);
  const place = take(places, verb.next);
  const other = take(names, place.next);
  const templates = [
    `${name.item} saw the ${adj.item} ${noun.item} ${verb.item} to the ${place.item} with ${other.item}.`,
    `The ${adj.item} ${noun.item} ${verb.item} on the ${place.item} with ${name.item} and ${other.item}.`,
    `${name.item} and ${other.item} like the ${adj.item} ${noun.item} at the ${place.item}.`,
    `Can ${name.item} see the ${adj.item} ${noun.item} ${verb.item} in the ${place.item} near ${other.item}?`,
    `${name.item} went to the ${place.item} and ${verb.item} a ${adj.item} ${noun.item} for ${other.item}.`,
    `The ${adj.item} ${noun.item} did not stop until ${name.item} and ${other.item} got to the ${place.item}.`,
    `${name.item} said to ${other.item}, "Look at the ${adj.item} ${noun.item} on the ${place.item}."`,
    `Here is a ${adj.item} ${noun.item} for ${name.item} by the ${place.item}, said ${other.item}.`,
    `${name.item} can help the ${adj.item} ${noun.item} at the ${place.item} with ${other.item}.`,
    `Do not let the ${adj.item} ${noun.item} in the ${place.item}, ${name.item} told ${other.item}.`,
    `${other.item} told ${name.item} that the ${adj.item} ${noun.item} ${verb.item} home from the ${place.item}.`,
    `We saw ${name.item} and ${other.item} and a ${adj.item} ${noun.item} play at the ${place.item}.`,
  ];
  return templates[other.next % templates.length];
};

const bookAt = (n) => {
  const a = take(names, n);
  const b = take(names, a.next);
  const noun = take(nouns, b.next);
  const noun2 = take(nouns, noun.next);
  const adj = take(adjs, noun2.next);
  const verb = take(verbs, adj.next);
  const place = take(places, verb.next);
  const templates = [
    `${a.item} has a ${adj.item} ${noun.item}. The ${noun.item} ${verb.item} to the ${place.item}. ${b.item} saw the ${noun2.item} too.`,
    `${b.item} sat by the ${place.item}. A ${adj.item} ${noun.item} came up to ${a.item}. Then the ${noun2.item} ${verb.item} over.`,
    `${a.item} and ${b.item} went to the ${place.item}. They saw a ${adj.item} ${noun.item} and a little ${noun2.item}. It was a good day.`,
    `The ${noun.item} was lost in the ${place.item}. ${a.item} looked with ${b.item}. At last they found the ${adj.item} ${noun.item} and the ${noun2.item}.`,
    `${a.item} wanted to go to the ${place.item}. ${b.item} said they could go after lunch. They packed a bag, took the ${noun.item}, and ${verb.item} down the path. The ${adj.item} ${noun2.item} came too.`,
    `One night the ${noun.item} sat in the ${place.item}. ${a.item} could not sleep. ${b.item} told a story about a ${adj.item} ${noun2.item}, and soon they all felt calm and safe.`,
    `${a.item} fed the ${noun.item} by the ${place.item}. Then ${b.item} ${verb.item} over and gave the ${adj.item} ${noun2.item} a hug.`,
    `In the ${place.item}, a ${adj.item} ${noun.item} and a ${noun2.item} played. ${a.item} sat still with ${b.item} and let them come close.`,
    `${b.item} made a home for the ${noun.item} in the ${place.item}. ${a.item} put a ${adj.item} rug down so the ${noun2.item} could rest after it ${verb.item}.`,
    `The ${noun.item} and the ${noun2.item} ran to the ${place.item}. ${a.item} and ${b.item} ${verb.item} after the ${adj.item} pair and had a good time.`,
  ];
  return templates[place.next % templates.length];
};

const remapRange = (level, oldMin, oldMax, newMin, newMax) =>
  Math.round(newMin + ((level - oldMin) * (newMax - newMin)) / (oldMax - oldMin));

const remapOldLevel = (level) => {
  if (level <= 20) return remapRange(level, 1, 20, 11, 28);
  if (level <= 40) return remapRange(level, 21, 40, 29, 46);
  if (level <= 70) return remapRange(level, 41, 70, 47, 73);
  return remapRange(level, 71, 100, 74, 100);
};

const fillLevel = (level, kind, makeText, start, count = 12) => {
  let n = start;
  let added = 0;
  let guard = 0;
  while (added < count && guard < 20000) {
    const before = items.length;
    add(level, kind, makeText(n));
    if (items.length > before) added += 1;
    n += 1;
    guard += 1;
  }
  return n;
};

const items = [];
const used = new Set();

const add = (level, kind, text) => {
  const clean = text.trim().replace(/\s+/g, " ");
  const key = `${level}:${clean.toLowerCase()}`;
  if (!clean || used.has(key)) return;
  used.add(key);
  const n = String(level).padStart(3, "0");
  const i = String(items.filter((item) => item.level === level).length).padStart(3, "0");
  items.push({ id: `l${n}-${i}`, text: clean, level, kind });
};

for (let level = 1; level <= 10; level += 1) {
  for (const item of letters[level] ?? []) add(level, "letter", item);
}

for (let level = 1; level <= 20; level += 1) {
  for (const word of words[level] ?? []) add(remapOldLevel(level), "word", word);
}

for (let level = 21; level <= 40; level += 1) {
  for (const phrase of phraseSets[level] ?? []) add(remapOldLevel(level), "phrase", phrase);
}

let sentenceN = 0;
for (let level = 41; level <= 70; level += 1) {
  sentenceN = fillLevel(remapOldLevel(level), "sentence", sentenceAt, sentenceN);
}

let bookN = 0;
for (let level = 71; level <= 100; level += 1) {
  bookN = fillLevel(remapOldLevel(level), "book", bookAt, bookN);
}

const missing = [];
for (let level = 1; level <= 100; level += 1) {
  const count = items.filter((item) => item.level === level).length;
  if (count < 8) missing.push(`${level}:${count}`);
}

if (missing.length > 0) {
  throw new Error(`Not enough texts at levels: ${missing.join(", ")}`);
}

const file = `import { ReadingText } from "./type.app.js";

export const corpus = ${JSON.stringify(items, null, 2)} as unknown as ReadingText[];

export const corpusById: Record<string, ReadingText> = Object.fromEntries(corpus.map((item) => [item.id, item]));

export const textsAtLevel = (level: number): ReadingText[] => corpus.filter((item) => item.level === level);

export const sampleTextAtLevel = (level: number): ReadingText | undefined => textsAtLevel(level)[0];
`;

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../src/shared/corpus.ts");
await writeFile(out, file);
console.log(`Wrote ${items.length} texts to src/shared/corpus.ts`);
