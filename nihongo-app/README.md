# 🌸 Nihongo Path

A small, offline-friendly web app for learning Japanese. It's plain HTML, CSS and JS, with no build step and no dependencies.

## Features
- **Lesson path**: Hiragana (10 lessons), Katakana (10 lessons) and First Words vocab (6 themed units). Each lesson unlocks the next.
- **Lesson flow**: new characters or words are introduced first, then mixed practice:
  - multiple choice (sound or meaning)
  - reverse (pick the Japanese)
  - listening (🔊, then pick what you heard)
  - typing the romaji
  Missed questions come back once at the end.
- **Spaced repetition review**: a Leitner-box system (1, 2, 4, 8, 16, 32 days) schedules each card.
- **🗣️ Speak (free)**: role-play real situations out loud: a café, introducing yourself, asking directions, a restaurant and a convenience store.
  - The partner speaks first. You answer with the 🎤 or by typing romaji or Japanese, and the app scores how close you were.
  - Every line has Play, Romaji and Translate buttons, and you can show suggested answers.
  - Speech recognition is built into the browser and free. It works best in Chrome or Edge.
- **🤖 AI tutor (optional, off by default)**: free conversation in any scenario, with grammar corrections and ideas for what to say next. It needs `server.js` and a Claude API key, and you pay per use.
- **Kana chart**: tap any character to hear it. Mastered characters get a green border.
- **Motivation**: XP, a daily goal, a day streak and a weekly chart.
- **Audio**: uses the browser's built-in Japanese text-to-speech (`speechSynthesis`, `ja-JP`).
- Progress is saved in `localStorage`. Supports dark mode and is mobile-first. Includes a web manifest so it can be installed to the home screen.

## Run it
Open `index.html` in a browser, or serve the folder:

```bash
cd nihongo-app && python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Optional: AI tutor

The whole app works for free without this. To turn on the AI conversation partner:

```bash
cd nihongo-app && npm install
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Then open http://localhost:8000. A "Free talk with AI tutor" button appears under each scenario.

- The default model is `claude-opus-5-5`. To keep costs very low, set `NIHONGO_MODEL=claude-haiku-5-5`, which is about 40x cheaper per message.
- The server keeps your key private. The browser never sees it.

## Add content
All course content lives in `data.js`. Add rows to `HIRAGANA_ROWS` / `KATAKANA_ROWS`, or add a unit to `VOCAB_UNITS`:

```js
["Colors", "🎨", [["あか", "aka", "red"], ["あお", "ao", "blue"]]],
```

Role-play scenarios live in `speak-data.js`. Each turn has the partner's line and one or more accepted answers.
