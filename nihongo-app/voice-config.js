// Voice configuration for Japanese: accents, voice profiles and the voices that fit them.
// Voice names are matched against what the browser offers (Edge exposes Azure neural voices
// as "Microsoft Nanami Online (Natural)…", Apple as "Kyoko", Chrome as "Google 日本語").
const VOICE_LANG = { code: "ja", name: "Japanese", mascot: "Kitsu", icon: "🦊", other: "Spanish" };
const VOICE_ACCENTS = [
  {
    id: "ja-JP", flag: "🇯🇵", name: "Standard Japanese · Tokyo", native: "標準語（東京）",
    note: "Hyōjungo, the standard used on NHK: Tokyo pitch accent, long vowels and the small っ pause kept exact.",
    sample: "こんにちは。今日はとてもいい天気ですね。",
    profiles: {
      "f-soft": [/nanami/i, /kyoko/i, /haruka/i, /google/i, /ayumi/i],
      "f-bright": [/aoi/i, /mayu/i, /shiori/i, /nanami/i, /kyoko/i, /google/i],
      "m-calm": [/keita/i, /otoya/i, /hattori/i, /ichiro/i],
      "m-deep": [/naoki/i, /daichi/i, /masaru/i, /keita/i, /otoya/i, /ichiro/i],
    },
  },
];
const VOICE_FEMALE = /nanami|kyoko|haruka|ayumi|aoi|mayu|shiori|mizuki|o-ren|sayaka|google|female/i;
const VOICE_MALE = /keita|otoya|hattori|ichiro|naoki|daichi|masaru|male/i;
const VOICE_TEST_SENTENCES = [
  "こんにちは。今日はとてもいい天気ですね。",
  "昨日は何をしましたか？一緒にコーヒーを飲みに行きませんか？",
  "大丈夫ですよ。ゆっくり話してください。",
];
const MASCOT_SAMPLE = "やっほー！キツだよ！今日も一緒にがんばろうね！";
// Where natural voices come from, per browser / device.
const VOICE_SOURCES = [
  ["Microsoft Edge", "Nanami ♀ · Keita ♂ (Tokyo)", "✨ Azure neural voices, free, nothing to install", "Open the app in Edge"],
  ["Google Chrome", "Google 日本語 ♀", "Good neural quality, needs internet", "Open the app in Chrome"],
  ["iPhone · iPad · Mac", "Kyoko ♀ · Otoya ♂", "✨ Natural with the Enhanced / Premium download", "Settings → Accessibility → Spoken Content → Voices → Japanese"],
  ["Android", "Google voices I–IV", "✨ Neural", "Settings → Text-to-speech → Google → Install voice data → Japanese"],
  ["Windows", "Haruka ♀ · Ayumi ♀ · Ichiro ♂", "🤖 Older generation, robotic", "Built in. Use Edge for natural voices"],
];
