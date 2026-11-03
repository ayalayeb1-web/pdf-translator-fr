#!/usr/bin/env node
// Pre-generates studio-quality neural audio for every fixed sentence of the course
// (vocabulary, examples, exercises, readings, role-plays, phrase packs, test sentences).
// The app plays these recordings first (voice-engine.js), on every browser, so quality no
// longer depends on the user's device.
//
//   node tools/generate-audio.mjs --dry-run                 # list what would be generated + character count
//   AZURE_SPEECH_KEY=… AZURE_SPEECH_REGION=westeurope node tools/generate-audio.mjs --engine azure
//   ELEVENLABS_API_KEY=… node tools/generate-audio.mjs --engine elevenlabs
//   GOOGLE_TTS_KEY=… node tools/generate-audio.mjs --engine google
//   OPENAI_API_KEY=… node tools/generate-audio.mjs --engine openai
//   node tools/generate-audio.mjs --engine mock              # fake tones, to test the pipeline offline
//
// Options: --voices id1,id2   --modes natural,teach   --only test   --limit 50
// Voices per accent/profile are set in tools/voices.json. Files land in audio/ with audio/manifest.json.
// Already generated files are skipped (cache), so re-running only adds what's new.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
const DRY = !!opt("dry-run", false), ENGINE = opt("engine", null), ONLY = opt("only", null);
const MODES = String(opt("modes", "natural,teach")).split(",");
const LIMIT = Number(opt("limit", 0)) || Infinity;

// ---------- 1. collect every fixed sentence of the course ----------
const ctx = { window: {}, state: {}, console, document: undefined };
vm.createContext(ctx);
const dataFiles = ["data.js", "course-a1.js", "course-a2.js", "course-advanced.js", "course-extra.js", "levels.js", "speak-data.js", "speak-gym-data.js", "voice-config.js"];
const src = dataFiles.filter(f => fs.existsSync(path.join(root, f))).map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n;\n");
vm.runInContext(src + `
;globalThis.__data = { LEVELS, VOICE_LANG, VOICE_ACCENTS, VOICE_TEST_SENTENCES, MASCOT_SAMPLE,
  SCENARIOS: typeof SCENARIOS !== "undefined" ? SCENARIOS : [],
  PHRASE_PACKS: typeof PHRASE_PACKS !== "undefined" ? PHRASE_PACKS : [],
  MINIMAL_PAIRS: typeof MINIMAL_PAIRS !== "undefined" ? MINIMAL_PAIRS : [] };`, ctx);
const D = ctx.__data, JA = D.VOICE_LANG.code === "ja", joiner = JA ? "" : " ";
const texts = new Set();
const add = t => { if (typeof t === "string" && t.trim()) texts.add(t.trim()); };
D.VOICE_TEST_SENTENCES.forEach(add); D.VOICE_ACCENTS.forEach(a => add(a.sample)); add(D.MASCOT_SAMPLE);
if (ONLY !== "test") {
  for (const lvl of D.LEVELS) for (const unit of lvl.units) for (const l of unit.lessons) {
    (l.items || []).forEach(it => { add(it.jp); if (it.kana) add(it.kana.split("・")[0]); });
    (l.examples || []).forEach(e => add(e[0]));
    (l.exercises || []).forEach(e => {
      if (e.fill) add(e.fill.replace("＿", e.answer).replace(/\(.*?\)|（.*?）/g, "").trim());
      if (e.order) add(e.order.join(joiner));
    });
    if (l.tokens) add(l.tokens.map(t => t.t).join(joiner));
  }
  for (const sc of D.SCENARIOS) { sc.turns.forEach(t => { add(t.npc[0]); t.answers.forEach(a => add(a[0])); }); add(sc.outro[0]); }
  for (const p of D.PHRASE_PACKS) p.phrases.forEach(ph => add(ph[0]));
  for (const pr of D.MINIMAL_PAIRS) { add(pr[0]); add(pr[3]); }
}
const all = [...texts].slice(0, LIMIT);

// Same hash as voice-engine.js (FNV-1a over code points of the NFC text).
const hash = s => { let h = 0x811c9dc5; for (const ch of s.trim().normalize("NFC")) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };

// ---------- 2. voices ----------
let voices = JSON.parse(fs.readFileSync(path.join(root, "tools/voices.json"), "utf8")).voices;
if (ENGINE) voices = voices.filter(v => v.engine === ENGINE || ENGINE === "mock");
const pick = opt("voices", null);
if (pick) voices = voices.filter(v => String(pick).split(",").includes(v.id));
const chars = all.reduce((a, t) => a + t.length, 0);
console.log(`${all.length} sentences · ${chars.toLocaleString()} characters per voice and mode`);
console.log(`${voices.length} voice(s) × ${MODES.length} mode(s) → about ${(chars * voices.length * MODES.length).toLocaleString()} characters to synthesize`);
if (DRY) { voices.forEach(v => console.log(`  ${v.id.padEnd(14)} ${v.engine.padEnd(11)} ${v.voice}`)); all.slice(0, 12).forEach(t => console.log("  · " + t)); process.exit(0); }
if (!ENGINE) { console.error("Choose an engine: --engine azure | google | elevenlabs | openai | mock (or --dry-run)"); process.exit(1); }

// ---------- 3. engines ----------
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Pedagogical rendition: slower AND real pauses after commas and sentences (prosody is recomputed by the engine).
const teachBody = t => xml(t).replace(/([、，,;])\s*/g, '$1<break time="300ms"/>').replace(/([。！？!?.])\s*/g, '$1<break time="550ms"/>');
const STYLE = {
  "es-ES": "a native speaker from Madrid with a natural Castilian accent (distinción: c/z as θ, strong jota)",
  "es-MX": "a native speaker from Mexico City with a natural Mexican accent (seseo, melodic intonation)",
  "es-CO": "a native speaker from Bogotá with a natural Colombian accent (seseo, very clear, calm rhythm)",
  "ja-JP": "a native speaker from Tokyo using standard Japanese (hyōjungo) with correct pitch accent, long vowels and geminates",
};
async function synth(v, text, mode) {
  const teach = mode === "teach";
  if (ENGINE === "mock" || v.engine === "mock") return mockWav(text);
  if (v.engine === "azure") {
    const key = need("AZURE_SPEECH_KEY"), region = need("AZURE_SPEECH_REGION");
    const body = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${v.accent}"><voice name="${v.voice}">${v.style ? `<mstts:express-as style="${v.style}">` : ""}<prosody rate="${teach ? "-18%" : "0%"}">${teach ? teachBody(text) : xml(text)}</prosody>${v.style ? "</mstts:express-as>" : ""}</voice></speak>`;
    return post(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, body, { "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3", "User-Agent": "language-app-audio" });
  }
  if (v.engine === "google") {
    const key = need("GOOGLE_TTS_KEY"), chirp = /chirp/i.test(v.voice);
    const input = chirp ? { text } : { ssml: `<speak>${teach ? teachBody(text) : xml(text)}</speak>` };
    const res = await post(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, JSON.stringify({ input, voice: { languageCode: v.accent, name: v.voice }, audioConfig: { audioEncoding: "MP3", speakingRate: teach ? 0.85 : 1 } }), { "Content-Type": "application/json" });
    return Buffer.from(JSON.parse(res.toString()).audioContent, "base64");
  }
  if (v.engine === "elevenlabs") {
    const key = need("ELEVENLABS_API_KEY");
    return post(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice}?output_format=mp3_44100_96`, JSON.stringify({
      text, model_id: v.model || "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, speed: teach ? 0.85 : 1 },
    }), { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" });
  }
  if (v.engine === "openai") {
    const key = need("OPENAI_API_KEY");
    const instructions = `Speak as ${STYLE[v.accent]}. Warm, natural, conversational, like talking to a friend.` + (teach ? " Speak a little slower and very clearly for a language learner, with short natural pauses between phrases, without exaggerating." : "");
    return post("https://api.openai.com/v1/audio/speech", JSON.stringify({ model: v.model || "gpt-4o-mini-tts", voice: v.voice, input: text, instructions, response_format: "mp3" }), { Authorization: `Bearer ${key}`, "Content-Type": "application/json" });
  }
  throw new Error("Unknown engine " + v.engine);
}
function need(k) { if (!process.env[k]) { console.error(`Missing environment variable ${k}`); process.exit(1); } return process.env[k]; }
async function post(url, body, headers, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { method: "POST", headers, body });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const msg = (await r.text()).slice(0, 300);
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 1000 * 2 ** i)); continue; }
    throw new Error(`${r.status} ${msg}`);
  }
  throw new Error("Too many retries");
}
// A short WAV tone whose length follows the text, so the whole pipeline can be tested without a key.
function mockWav(text) {
  const rate = 16000, secs = Math.min(4, 0.4 + text.length * 0.06), n = Math.floor(rate * secs);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 3000 * Math.min(1, (n - i) / 800)), 44 + i * 2);
  return buf;
}

// ---------- 4. generate (cached) and write the manifest ----------
const outDir = path.join(root, "audio"), manifestPath = path.join(outDir, "manifest.json");
fs.mkdirSync(outDir, { recursive: true });
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { version: 1, voices: {}, clips: {} };
const ext = ENGINE === "mock" ? "wav" : "mp3";
let made = 0, skipped = 0, failed = 0;
const jobs = [];
for (const v of voices) {
  manifest.voices[v.id] = { accent: v.accent, profile: v.profile, engine: ENGINE === "mock" ? "mock" : v.engine, voice: v.voice, label: v.label };
  fs.mkdirSync(path.join(outDir, v.id), { recursive: true });
  for (const t of all) for (const mode of MODES) jobs.push({ v, t, mode });
}
async function worker() {
  while (jobs.length) {
    const { v, t, mode } = jobs.shift();
    const h = hash(t), rel = `${v.id}/${h}.${mode}.${ext}`, file = path.join(outDir, rel);
    const entry = (manifest.clips[h] = manifest.clips[h] || {}), ve = (entry[v.id] = entry[v.id] || {});
    if (fs.existsSync(file)) { ve[mode] = rel; skipped++; continue; }
    try {
      fs.writeFileSync(file, await synth(v, t, mode));
      ve[mode] = rel; made++;
      if (made % 25 === 0) { fs.writeFileSync(manifestPath, JSON.stringify(manifest)); process.stdout.write(`  ${made} generated…\n`); }
    } catch (e) { failed++; if (failed <= 5) console.error(`  ✗ ${v.id} "${t.slice(0, 30)}": ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: ENGINE === "mock" ? 8 : 4 }, worker));
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`Done: ${made} generated, ${skipped} already cached, ${failed} failed → ${path.relative(process.cwd(), manifestPath)}`);
