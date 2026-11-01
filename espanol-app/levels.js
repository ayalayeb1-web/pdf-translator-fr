// Assembles every level into LEVELS and builds ALL_ITEMS (used by review/quizzes).
const LEVEL_INFO = [
  ["A1", "A1", "Beginner", "Greetings, ser & estar, ordering in a bar, your city"],
  ["A2", "A2", "Elementary", "Past tenses, routines, shopping, the future"],
  ["B1", "B1", "Intermediate", "The subjunctive, telling stories, polite Spanish"],
  ["B2", "B2", "Upper-intermediate", "Hypotheticals, opinions, news, work Spanish"],
  ["C1", "C1", "Advanced", "Fine nuances, register, idioms, culture"],
  ["C2", "C2", "Mastery", "Literature, native-like nuance, formal speech"],
];
const UNIT_COLORS = ["#ff5a4f", "#2f5be0", "#f6a609", "#14a37f", "#8b5cf6", "#e0457b", "#0ea5c6", "#d97706"];

const LEVELS = LEVEL_INFO.map(([id, dele, name, desc]) => {
  let units;
  if (id === "A1") units = A1_UNITS;
  else if (id === "A2") units = A2_UNITS;
  else units = ADVANCED_OUTLINE[id].map(([title, icon, lessons]) => ({
    title, icon, ai: true,
    lessons: lessons.map(([lid, ltitle, point]) => ({ id: lid, title: ltitle, point, type: "grammar", ai: true, level: id })),
  }));
  if (AI_READING[id]) {
    const [rid, rtitle, about] = AI_READING[id];
    units.push({ title: "Reading", icon: "📖", ai: true, lessons: [{ id: rid, title: rtitle, point: about, type: "reading", ai: true, level: id }] });
  }
  units.forEach((u, i) => (u.color = u.color || UNIT_COLORS[i % UNIT_COLORS.length]));
  // `jlpt` is the engine's name for the exam label; here it's the DELE level.
  return { id, jlpt: "DELE " + dele, name, desc, units, ai: !["A1", "A2"].includes(id) };
});

const ALL_ITEMS = {};
function registerItems(lesson) {
  for (const it of lesson.items || []) ALL_ITEMS[it.id] = { ...it, type: lesson.type === "grammar" ? "vocab" : lesson.type };
}
LEVELS.forEach(l => l.units.forEach(u => u.lessons.forEach(registerItems)));
