// Course content for Nihongo Path.
// Each kana row becomes one lesson; vocab is grouped into themed units.

const HIRAGANA_ROWS = [
  ["Vowels", "あいうえお", "a i u e o"],
  ["K-row", "かきくけこ", "ka ki ku ke ko"],
  ["S-row", "さしすせそ", "sa shi su se so"],
  ["T-row", "たちつてと", "ta chi tsu te to"],
  ["N-row", "なにぬねの", "na ni nu ne no"],
  ["H-row", "はひふへほ", "ha hi fu he ho"],
  ["M-row", "まみむめも", "ma mi mu me mo"],
  ["Y-row", "やゆよ", "ya yu yo"],
  ["R-row", "らりるれろ", "ra ri ru re ro"],
  ["W-row + ん", "わをん", "wa wo n"],
];

const KATAKANA_ROWS = [
  ["Vowels", "アイウエオ", "a i u e o"],
  ["K-row", "カキクケコ", "ka ki ku ke ko"],
  ["S-row", "サシスセソ", "sa shi su se so"],
  ["T-row", "タチツテト", "ta chi tsu te to"],
  ["N-row", "ナニヌネノ", "na ni nu ne no"],
  ["H-row", "ハヒフヘホ", "ha hi fu he ho"],
  ["M-row", "マミムメモ", "ma mi mu me mo"],
  ["Y-row", "ヤユヨ", "ya yu yo"],
  ["R-row", "ラリルレロ", "ra ri ru re ro"],
  ["W-row + ン", "ワヲン", "wa wo n"],
];

// [japanese, reading (romaji), english]
const VOCAB_UNITS = [
  ["Greetings", "👋", [
    ["こんにちは", "konnichiwa", "hello"],
    ["おはよう", "ohayou", "good morning"],
    ["こんばんは", "konbanwa", "good evening"],
    ["ありがとう", "arigatou", "thank you"],
    ["すみません", "sumimasen", "excuse me / sorry"],
    ["さようなら", "sayounara", "goodbye"],
  ]],
  ["Numbers", "🔢", [
    ["いち", "ichi", "one"],
    ["に", "ni", "two"],
    ["さん", "san", "three"],
    ["よん", "yon", "four"],
    ["ご", "go", "five"],
    ["ろく", "roku", "six"],
    ["なな", "nana", "seven"],
    ["はち", "hachi", "eight"],
    ["きゅう", "kyuu", "nine"],
    ["じゅう", "juu", "ten"],
  ]],
  ["Food & Drink", "🍙", [
    ["みず", "mizu", "water"],
    ["おちゃ", "ocha", "green tea"],
    ["ごはん", "gohan", "rice / meal"],
    ["さかな", "sakana", "fish"],
    ["たまご", "tamago", "egg"],
    ["コーヒー", "koohii", "coffee"],
    ["パン", "pan", "bread"],
  ]],
  ["People", "🧑", [
    ["わたし", "watashi", "I / me"],
    ["あなた", "anata", "you"],
    ["ともだち", "tomodachi", "friend"],
    ["せんせい", "sensei", "teacher"],
    ["がくせい", "gakusei", "student"],
    ["かぞく", "kazoku", "family"],
  ]],
  ["Nature", "🌸", [
    ["さくら", "sakura", "cherry blossom"],
    ["やま", "yama", "mountain"],
    ["かわ", "kawa", "river"],
    ["そら", "sora", "sky"],
    ["あめ", "ame", "rain"],
    ["ねこ", "neko", "cat"],
    ["いぬ", "inu", "dog"],
  ]],
  ["Useful Phrases", "💬", [
    ["はい", "hai", "yes"],
    ["いいえ", "iie", "no"],
    ["おいしい", "oishii", "delicious"],
    ["わかりました", "wakarimashita", "understood"],
    ["いくらですか", "ikura desu ka", "how much is it?"],
    ["トイレはどこですか", "toire wa doko desu ka", "where is the toilet?"],
  ]],
];

function kanaItems(rows, script) {
  return rows.map(([title, chars, romaji], i) => {
    const r = romaji.split(" ");
    return {
      id: `${script}-${i}`,
      title,
      type: "kana",
      items: [...chars].map((c, j) => ({ id: `${script}:${c}`, jp: c, romaji: r[j], en: r[j] })),
    };
  });
}

const COURSE = [
  { name: "Hiragana", icon: "あ", color: "#ff7aa2", lessons: kanaItems(HIRAGANA_ROWS, "hira") },
  { name: "Katakana", icon: "ア", color: "#7a9cff", lessons: kanaItems(KATAKANA_ROWS, "kata") },
  {
    name: "First Words", icon: "語", color: "#4fc3a1",
    lessons: VOCAB_UNITS.map(([title, emoji, words], i) => ({
      id: `vocab-${i}`,
      title: `${emoji} ${title}`,
      type: "vocab",
      items: words.map(([jp, romaji, en]) => ({ id: `vocab:${jp}`, jp, romaji, en })),
    })),
  },
];

const ALL_ITEMS = Object.fromEntries(
  COURSE.flatMap(s => s.lessons.flatMap(l => l.items.map(it => [it.id, { ...it, type: l.type }])))
);
