// Bundles the app into one self-contained HTML file for publishing as a claude.ai artifact.
// Usage: node tools/build-artifact.mjs <output.html>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const out = process.argv[2];
if (!out) { console.error("Usage: node tools/build-artifact.mjs <output.html>"); process.exit(1); }

const html = read("index.html");
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("<script")).trim();
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const s of scripts) if (read(s).includes("</script")) throw new Error(`${s} contains </script`);

fs.writeFileSync(out, `<title>Nihongo Path</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${read("styles.css")}
</style>
${body}
${scripts.map(s => `<script>\n${read(s)}\n</script>`).join("\n")}
`);
console.log(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
