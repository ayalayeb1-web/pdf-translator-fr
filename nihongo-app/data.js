// Shared course helpers + kana tables for Nihongo Path.
// Level content lives in course-a1.js, course-a2.js and course-advanced.js;
// levels.js assembles everything into LEVELS and ALL_ITEMS.

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

function kanaLessons(rows, script) {
  return rows.map(([title, chars, romaji], i) => {
    const r = romaji.split(" ");
    return {
      id: `${script}-${i}`, title, type: "kana",
      items: [...chars].map((c, j) => ({ id: `${script}:${c}`, jp: c, romaji: r[j], en: r[j] })),
    };
  });
}

// words: [written form, romaji, english, kana reading (only when written form has kanji)]
function vocabLesson(id, title, words) {
  return {
    id, title, type: "vocab",
    items: words.map(([jp, romaji, en, kana]) => ({ id: `vocab:${jp}`, jp, romaji, en, kana })),
  };
}

// chars: [kanji, readings in kana, readings in romaji ("a / b"), meaning]
function kanjiLesson(id, title, chars) {
  return {
    id, title, type: "kanji",
    items: chars.map(([jp, kana, romaji, en]) => ({ id: `kanji:${jp}`, jp, kana, romaji, en })),
  };
}

// A grammar lesson: explanation, example sentences, then exercises.
//  examples:  [jp, romaji, en]
//  exercises: { fill: "sentence with ＿", options: [...], answer, en }
//          or { order: ["tile", "tile", ...] (correct order), en }
function grammarLesson(id, title, point, explain, examples, exercises) {
  return { id, title, type: "grammar", point, explain, examples, exercises };
}
