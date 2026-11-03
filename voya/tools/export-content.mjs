// Exports the hand-written course content of the two web prototypes into JSON assets for the Flutter app.
// Usage: node voya/tools/export-content.mjs
import fs from "node:fs"; import vm from "node:vm"; import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const out = path.join(root, "voya/assets/content"); fs.mkdirSync(out, { recursive: true });
const sets = { ja: ["data.js", "course-a1.js", "course-a2.js", "course-advanced.js", "course-extra.js", "levels.js"],
               es: ["data.js", "course-a1.js", "course-a2.js", "course-advanced.js", "levels.js"] };
const dirs = { ja: "nihongo-app", es: "espanol-app" };
for (const [lang, files] of Object.entries(sets)) {
  const ctx = vm.createContext({ console, window: {}, document: { addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} } });
  const src = files.filter(f => fs.existsSync(path.join(root, dirs[lang], f))).map(f => fs.readFileSync(path.join(root, dirs[lang], f), "utf8")).join("\n;\n");
  vm.runInContext(src + "\n;globalThis.__out = { levels: LEVELS };", ctx);
  const levels = JSON.parse(JSON.stringify(ctx.__out.levels));
  fs.writeFileSync(path.join(out, `${lang}.json`), JSON.stringify({ lang, levels }));
  const n = levels.flatMap(l => l.units.flatMap(u => u.lessons)); 
  console.log(lang, "levels", levels.length, "lessons", n.length, "written", n.filter(x => !x.ai).length, "types", [...new Set(n.map(x => x.type))].join(","));
}
