// Assembles every level into LEVELS and builds ALL_ITEMS (used by review/quizzes).
const LEVEL_INFO = [
  ["A1", "N5", "Beginner", "Kana, first kanji, introductions, shopping"],
  ["A2", "N4", "Elementary", "Te-form, wants & abilities, casual speech"],
  ["B1", "N3", "Intermediate", "Passive & causative, conditionals, everyday conversations"],
  ["B2", "N2", "Upper-intermediate", "News, work Japanese, nuanced grammar"],
  ["C1", "N1", "Advanced", "Formal written Japanese, complex texts"],
  ["C2", "N1+", "Mastery", "Keigo, literature, idioms, dialects"],
];
const UNIT_COLORS = ["#ff7aa2", "#7a9cff", "#4fc3a1", "#f2a541", "#b07aff", "#3cb8d8", "#ef6f6c", "#8bbf4a"];

const LEVELS = LEVEL_INFO.map(([id, jlpt, name, desc]) => {
  let units;
  if (id === "A1") units = A1_UNITS;
  else if (id === "A2") units = A2_UNITS;
  else units = ADVANCED_OUTLINE[id].map(([title, icon, lessons]) => ({
    title, icon, ai: true,
    lessons: lessons.map(([lid, ltitle, point]) => ({ id: lid, title: ltitle, point, type: "grammar", ai: true, level: id })),
  }));
  units.forEach((u, i) => (u.color = u.color || UNIT_COLORS[i % UNIT_COLORS.length]));
  return { id, jlpt, name, desc, units, ai: !["A1", "A2"].includes(id) };
});

const ALL_ITEMS = {};
function registerItems(lesson) {
  for (const it of lesson.items || []) ALL_ITEMS[it.id] = { ...it, type: lesson.type === "grammar" ? "vocab" : lesson.type };
}
LEVELS.forEach(l => l.units.forEach(u => u.lessons.forEach(registerItems)));
