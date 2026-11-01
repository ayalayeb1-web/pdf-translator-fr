// Optional server for Nihongo Path.
// - Serves the static app (works without any API key).
// - Adds POST /api/tutor: an AI conversation partner for the Speak tab, powered by Claude.
//   Enabled only when credentials are present (ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN,
//   or NIHONGO_AI=1 if you use an `ant auth login` profile).
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8000;
const MODEL = process.env.NIHONGO_MODEL || "claude-opus-5-5";
const AI_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.NIHONGO_AI === "1");
const client = AI_ENABLED ? new Anthropic() : null;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".png": "image/png" };
const PUBLIC = new Set(["index.html", "app.js", "data.js", "speak.js", "speak-data.js", "styles.css", "icon.svg", "manifest.webmanifest"]);

const REPLY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "feedback", "suggestions"],
  properties: {
    reply: {
      type: "object", additionalProperties: false, required: ["jp", "romaji", "en"],
      properties: { jp: { type: "string" }, romaji: { type: "string" }, en: { type: "string" } },
    },
    feedback: {
      type: "object", additionalProperties: false,
      required: ["correct", "corrected_jp", "corrected_romaji", "explanation"],
      properties: {
        correct: { type: "boolean" },
        corrected_jp: { type: "string" },
        corrected_romaji: { type: "string" },
        explanation: { type: "string" },
      },
    },
    suggestions: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["jp", "romaji", "en"],
        properties: { jp: { type: "string" }, romaji: { type: "string" }, en: { type: "string" } },
      },
    },
  },
};

function systemPrompt({ title, goal, partner }) {
  return `You are a friendly Japanese conversation partner in a language-learning app for beginners.
Role-play scenario: "${title}". You play: ${partner}. The learner's goal: ${goal}.

Each turn:
- reply: stay in character and answer in short, natural, polite Japanese (one or two sentences, mostly kana with only very common kanji), with romaji and an English translation. Keep the conversation moving toward the learner's goal; when the goal is reached, wrap up warmly.
- feedback: judge the learner's most recent message. The learner may write in Japanese or romaji, and speech recognition may have mangled it, so be forgiving about recognition errors and focus on real grammar, word choice and politeness. If it was fine, set correct=true and leave the other feedback fields empty. Otherwise give a corrected version and a one-sentence explanation in simple English. If there is no learner message yet, set correct=true.
- suggestions: two or three short things the learner could say next, at beginner level.`;
}

async function tutor(body) {
  const { scenario, history } = body;
  if (!scenario?.title || !Array.isArray(history) || history.length > 60) throw Object.assign(new Error("Bad request"), { status: 400 });
  // The API expects the conversation to start with a user turn.
  /** @type {Anthropic.Beta.Messages.BetaMessageParam[]} */
  const messages = [{ role: "user", content: "(Start the role-play now: greet me in character.)" }];
  for (const turn of history) {
    const role = turn.role === "assistant" ? "assistant" : "user";
    const text = String(turn.text || "").slice(0, 500);
    if (role === "user") messages.push({ role: "user", content: `Learner said: ${text}` });
    else messages.push({ role: "assistant", content: text });
  }

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: REPLY_SCHEMA } },
    system: systemPrompt(scenario),
    messages,
  });

  if (response.stop_reason === "refusal") throw Object.assign(new Error("The tutor couldn't answer that. Try saying something else."), { status: 422 });
  const text = response.content.filter(b => b.type === "text").map(b => b.text).join("");
  return JSON.parse(text);
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 100_000) throw Object.assign(new Error("Too large"), { status: 413 }); }
  return JSON.parse(raw || "{}");
}

const server = http.createServer(async (req, res) => {
  const send = (status, data, type = "application/json") => {
    res.writeHead(status, { "Content-Type": type });
    res.end(type === "application/json" ? JSON.stringify(data) : data);
  };
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/health") return send(200, { ai: AI_ENABLED });
    if (url.pathname === "/api/tutor" && req.method === "POST") {
      if (!AI_ENABLED) return send(503, { error: "AI tutor is not configured on this server." });
      return send(200, await tutor(await readJson(req)));
    }
    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    if (!PUBLIC.has(name)) return send(404, "Not found", "text/plain");
    return send(200, await fs.readFile(path.join(here, name)), MIME[path.extname(name)] || "application/octet-stream");
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return send(429, { error: "Too many requests — wait a moment and try again." });
    if (err instanceof Anthropic.AuthenticationError) return send(500, { error: "The server's API key is invalid." });
    if (err instanceof Anthropic.APIError) return send(502, { error: `AI service error (${err.status ?? "network"}).` });
    if (err instanceof SyntaxError) return send(400, { error: "Invalid JSON." });
    console.error(err);
    return send(err.status || 500, { error: err.status ? err.message : "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Nihongo Path running at http://localhost:${PORT}`);
  console.log(AI_ENABLED ? `AI tutor: ON (model ${MODEL})` : "AI tutor: OFF (free mode). Set ANTHROPIC_API_KEY to enable it.");
});
