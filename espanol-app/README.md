# ñ Vámonos: learn Castilian Spanish (Spain)

A sister app to Nihongo Path, built on the same engine, for learning **Spanish from Spain** (castellano) from A1 to C2. It is plain HTML, CSS and JS with no build step.

## Features
- **🗾 Journey map across Spain**: one region per level, each with its own hand-drawn scenery and ambient particles.

  | Level | DELE | Region | Content |
  |---|---|---|---|
  | A1 | A1 | Madrid | ser and estar, -ar/-er/-ir verbs, ordering in a bar, gustar, ir a. Hand-written: 10 units, 33 lessons. |
  | A2 | A2 | Sevilla | pretérito perfecto (used the way Spain uses it), indefinido, imperfecto, reflexives, comparisons, pronouns, imperative, future. Hand-written: 7 units, 18 lessons. |
  | B1 | B1 | Barcelona | Subjunctive, storytelling in the past, conditional, por/para. AI-written. |
  | B2 | B2 | Granada | Imperfect subjunctive, si-clauses, opinions, news and work Spanish. AI-written. |
  | C1 | C1 | Salamanca | Fine nuances, register, idioms, culture. AI-written. |
  | C2 | C2 | Camino de Santiago | Literature, native-like nuance, formal speech. AI-written. |

- **Peninsular Spanish throughout**:
  - vosotros used as everyday Spanish
  - Spain vocabulary (coche, móvil, ordenador, zumo)
  - ordering with "¿Me pone…?"
  - Spain expressions (¡Venga!, ¡Qué pasada!, vale)
  - Spanish voices from Spain (es-ES) are chosen first
- **🐾 Lía the Iberian lynx**: an original mascot who cheers you on in Castilian Spanish. She has two personalities (Cheerful, or Gentle & polite) and four lesson voice styles.
- **Lessons**:
  - vocabulary, with a masculine or feminine tag on nouns
  - grammar: explanation, examples you can tap to hear, fill in the blank, and build the sentence
  - reading: tap any word for its meaning
- **Typing answers**: accents are optional but get flagged ("Watch the accents: café"). ñ is never treated as n. On-screen keys cover á é í ó ú ñ ü ¿ ¡.
- **🔥 Verbs (conjugation trainer)**: covers 37 verbs, including 20 key irregulars, across 7 tenses (presente, perfecto, indefinido, imperfecto, futuro, condicional, presente de subjuntivo) and all six persons.
  - Full verb tables, with irregular forms highlighted
  - Spaced-repetition drills by typing or by choosing
- **🗣️ Speaking gym**:
  - daily AI speaking mission
  - shadowing with phrase packs (bar and tapas, getting around, shopping, small talk, emergencies, polite and work Spanish, Spain expressions)
  - ear training: pero/perro, casa/caza (the Castilian "th"), papa/papá, cana/caña
  - 9 role-plays set in Spain
- **🎬 Watch & Learn**: add your own video plus Spanish subtitles. The AI finds the level and builds a three-step lesson: watch with subtitles, watch without subtitles, then a quiz.
- **Also included**: placement test, notes, spaced-repetition review, XP and streaks, auto-check and auto-next, light and dark themes.

## Run it
```bash
cd espanol-app && python3 -m http.server 8001
```

To publish as a single file: `node tools/build-artifact.mjs out.html`.

AI-written lessons, missions and Watch & Learn analysis use the claude.ai artifact `sample` capability, which runs on the viewer's own account.
