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

## Add content
All course content lives in `data.js`. Add rows to `HIRAGANA_ROWS` / `KATAKANA_ROWS`, or add a unit to `VOCAB_UNITS`:

```js
["Colors", "🎨", [["あか", "aka", "red"], ["あお", "ao", "blue"]]],
```
