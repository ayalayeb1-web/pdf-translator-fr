// Shared course helpers for Vámonos (Spanish).
// Items keep the engine's field names: jp = the Spanish text, en = English.
// (romaji mirrors the Spanish so older code paths keep working.)

// words: [spanish, english]
function vocabLesson(id, title, words) {
  return {
    id, title, type: "vocab",
    items: words.map(([es, en]) => ({ id: `vocab:${es}`, jp: es, romaji: es, en })),
  };
}

// A grammar lesson: explanation, example sentences, then exercises.
//  examples:  [spanish, english]
//  exercises: { fill: "sentence with ＿", options: [...], answer, en }
//          or { order: ["word", "word", ...] (correct order), en }
function grammarLesson(id, title, point, explain, examples, exercises) {
  return { id, title, type: "grammar", point, explain, examples: examples.map(([es, en]) => [es, "", en]), exercises };
}

// A reading lesson. `text` is space-separated words written as  word{meaning}
// (punctuation stays attached to its word; underscores in {…} are spaces).
// questions: [question, [options...], answer]
function readingLesson(id, title, text, translation, questions) {
  const tokens = text.trim().split(/\s+/).map(tok => {
    const m = tok.match(/^([^{]+)(?:\{([^}]+)\})?$/);
    return m ? { t: m[1], r: "", en: (m[2] || "").replace(/_/g, " ") } : { t: tok, r: "", en: "" };
  });
  return {
    id, title, type: "reading", tokens, translation,
    questions: questions.map(([q, options, answer]) => ({ q, options, answer })),
  };
}

// Accent-insensitive comparison that still keeps ñ distinct (año ≠ ano).
function foldEs(s) {
  return String(s).toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\u0001/g, "ñ").replace(/[¿?¡!.,;:"'()«»—–-]/g, " ").replace(/\s+/g, " ").trim();
}
