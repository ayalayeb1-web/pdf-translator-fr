# 🌸 Nihongo Path

A small, offline-friendly web app for learning Japanese. It's plain HTML, CSS and JS, with no build step and no dependencies.

## Features
- **Levels A1 → C2**, mapped to the JLPT:

  | Level | JLPT | Content |
  |---|---|---|
  | A1 | N5 | Kana, first kanji, introductions, shopping. Hand-written: 10 units, 49 lessons. |
  | A2 | N4 | Te-form, wants and abilities, experiences, casual speech. Hand-written: 6 units, 18 lessons. |
  | B1 | N3 | Passive and causative, conditionals, hearsay. 20 lessons, AI-written. |
  | B2 | N2 | Formal connectors, news and business Japanese. 16 lessons, AI-written. |
  | C1 | N1 | Written style and literary grammar. 12 lessons, AI-written. |
  | C2 | N1+ | Keigo, classical forms, idioms, dialects. 12 lessons, AI-written. |

  You can jump to any level. Inside a unit, lessons unlock in order.
- **Lesson types:**
  - kana
  - vocabulary, written with kanji and the kana reading
  - kanji (meanings and readings)
  - grammar: an explanation, examples you can tap to hear, then *fill in the blank* and *build the sentence* exercises
- **AI-written lessons (B1–C2)**: the course outline in `course-advanced.js` lists the real grammar points. The first time you open a lesson, it is generated with Claude through the claude.ai artifact `sample` capability, which uses the viewer's own account. It is then validated and saved on the device.
- **Quiz types**: multiple choice in both directions, listening, typing romaji (any listed kanji reading is accepted), fill in the blank, and sentence building. Missed questions come back once at the end.
- **🦊 Kitsu the mascot**: an original fox-spirit guide.
  - She greets you, reacts to every answer and celebrates combos and finished lessons with confetti.
  - She speaks Japanese out loud, with English below.
  - Tap her for tips about Japan.
- **🎯 Placement test**: an adaptive test with up to 18 questions that sets your starting level.
- **📖 Reading passages**: tap any word for its reading and meaning.
  - You can show or hide furigana, listen to the whole text and see the translation.
  - Comprehension questions follow.
  - A1 and A2 passages are hand-written; B1 to C2 passages are AI-written.
- **✍️ Writing practice**: trace kana and kanji over a guide and get a score for how well your ink matches the shape.
  - Each character links to stroke-order videos.
  - Practise from any lesson card or from the Write tab, which has a random drill.
- **🎌 Anime Japanese**: a bonus unit with reactions and story words, plus how anime characters talk (俺, 僕, ぞ, ぜ, わ). The Speak tab has a "meet your senpai" role-play.
- **▶ Videos**: buttons open YouTube results for each grammar point, stroke order and level, because videos can't be embedded in the app.
- **📝 Notes**: a note for each lesson (📝 in the lesson header) plus free notes, with search.
- **Extras**: word of the day, sound effects, answer combos, and settings to turn off the voice, sounds or furigana.
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

Then open http://localhost:8000. A "Chat with AI" button appears under each scenario.

- The default model is `claude-opus-5-5`. To keep costs very low, set `NIHONGO_MODEL=claude-haiku-5-5`, which is about 40x cheaper per message.
- The server keeps your key private. The browser never sees it.

## Add content
Course files: `data.js` (helpers and kana), `course-a1.js`, `course-a2.js`, `course-advanced.js` (B1–C2 outline) and `levels.js` (assembly). Add a lesson to a unit in `course-a1.js` / `course-a2.js` with the helpers:

```js
vocabLesson("a1-colors", "Colors", [["赤", "aka", "red", "あか"], ["青", "ao", "blue", "あお"]]),
grammarLesson("a1-mo", "Also", "〜も", "も replaces は/が to mean \"also\".",
  [["わたしも学生です。", "watashi mo gakusei desu.", "I'm a student too."]],
  [{ fill: "わたし＿学生です。", options: ["も", "を", "に", "で"], answer: "も", en: "I'm a student too." }]),
```

Role-play scenarios live in `speak-data.js`. Each turn has the partner's line and one or more accepted answers.
