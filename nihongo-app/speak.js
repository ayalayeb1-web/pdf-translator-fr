"use strict";
// Speak tab: free scripted role-plays (runs fully in the browser) plus an
// optional AI tutor. The tutor is shown when either:
//  - the app runs as a claude.ai artifact (uses the viewer's own Claude account), or
//  - server.js is running with an API key.

const IN_CLAUDE = typeof window.claude?.use === "function";
// Microphones are blocked inside the claude.ai viewer, so voice input is local-only.
const Recognition = IN_CLAUDE ? null : (window.SpeechRecognition || window.webkitSpeechRecognition);
let aiAvailable = null; // null = not checked yet
let sampleFn = null;

async function checkAi() {
  if (aiAvailable !== null) return aiAvailable;
  if (IN_CLAUDE) {
    try { sampleFn = await window.claude.use("sample"); } catch (_) { sampleFn = null; }
    return (aiAvailable = !!sampleFn);
  }
  if (location.protocol === "file:") return (aiAvailable = false);
  try {
    const r = await fetch("api/health");
    aiAvailable = r.ok && (await r.json()).ai === true;
  } catch (_) { aiAvailable = false; }
  return aiAvailable;
}

const TUTOR_RULES = sc => `You are a friendly Japanese conversation partner in a language-learning app for beginners.
Role-play scenario: "${sc.title}". You play: ${sc.partner}. The learner's goal: ${sc.goal}.

Each turn:
- reply: stay in character and answer in short, natural, polite Japanese (one or two sentences, mostly kana with only very common kanji), with romaji and an English translation. Keep the conversation moving toward the learner's goal; when the goal is reached, wrap up warmly.
- feedback: judge the learner's most recent message. They may write in Japanese or romaji, so be forgiving about spelling and focus on real grammar, word choice and politeness. If it was fine, set correct=true and leave the other feedback fields empty. Otherwise give a corrected version and a one-sentence explanation in simple English. If there is no learner message yet, set correct=true.
- suggestions: two or three short things the learner could say next, at beginner level.

Reply with only one JSON object in exactly this shape:
{"reply":{"jp":"…","romaji":"…","en":"…"},"feedback":{"correct":true,"corrected_jp":"","corrected_romaji":"","explanation":""},"suggestions":[{"jp":"…","romaji":"…","en":"…"}]}

The role-play starts now. Greet the learner in character.`;

// One tutor turn. Returns {reply, feedback, suggestions}; throws Error with a viewer-facing message.
async function tutorTurn(sc, history) {
  if (sampleFn) {
    const turns = [{ role: "user", content: TUTOR_RULES(sc) }];
    for (const t of history.slice(-30)) {
      turns.push(t.role === "assistant" ? { role: "assistant", content: t.text } : { role: "user", content: `Learner said: ${t.text}` });
    }
    try {
      const data = await sampleFn.json(turns, { modelTier: "quick", cache: false });
      if (!data?.reply?.jp) throw { code: "invalid_json" };
      return data;
    } catch (e) {
      const msg = {
        not_granted: "The AI tutor needs your permission to use Claude. Reload the page to be asked again.",
        sampling_disabled: "Claude isn't available on this account.",
        rate_limited: "You've hit a usage limit. Wait a bit, then try again.",
        invalid_json: "The tutor's answer came back garbled. Try again.",
        refused: "The tutor couldn't answer that. Try saying something else.",
      }[e?.code] || "The tutor couldn't be reached. Try again.";
      if (e?.code === "not_granted" || e?.code === "sampling_disabled") aiAvailable = false;
      throw new Error(msg);
    }
  }
  const r = await fetch("api/tutor", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario: { title: sc.title, goal: sc.goal, partner: sc.partner }, history }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------- Answer scoring ----------
// Katakana -> hiragana, drop punctuation/spaces so "コーヒーを下さい。" ~ "こーひーをください".
const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const cleanJp = s => toHira(s).replace(/[\s、。！？!?,.・「」ー〜~]/g, "").toLowerCase();
const isLatin = s => /^[\x00-\x7f\s]*$/.test(s);
function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const similarity = (a, b) => (!a.length && !b.length) ? 1 : 1 - levenshtein(a, b) / Math.max(a.length, b.length);

// Returns { score 0..1, best: [jp, romaji, en] } comparing every heard alternative to every accepted answer.
function scoreAnswer(heardList, answers) {
  let best = { score: 0, best: answers[0], heard: heardList[0] };
  for (const heard of heardList) {
    for (const ans of answers) {
      const sc = isLatin(heard)
        ? similarity(normalize(heard), normalize(ans[1]))
        : similarity(cleanJp(heard), cleanJp(ans[0]));
      if (sc > best.score) best = { score: sc, best: ans, heard };
    }
  }
  return best;
}

// ---------- Mic ----------
function listen(onResult, onEnd) {
  const rec = new Recognition();
  rec.lang = "ja-JP"; rec.interimResults = false; rec.maxAlternatives = 5;
  rec.onresult = e => onResult([...e.results[0]].map(a => a.transcript));
  rec.onerror = e => toast(e.error === "not-allowed" ? "Microphone permission denied" : "Didn't catch that — try again");
  rec.onend = onEnd;
  rec.start();
  return rec;
}

// ---------- UI helpers ----------
function bubble(who, jp, romaji, en, extra = "") {
  const id = "b" + Math.random().toString(36).slice(2);
  return `<div class="bubble ${who}" id="${id}">
    <div class="jp">${esc(jp)}</div>
    ${romaji ? `<div class="sub romaji" hidden>${esc(romaji)}</div>` : ""}
    ${en ? `<div class="sub en" hidden>${esc(en)}</div>` : ""}
    ${extra}
    <div class="tools">
      <button data-say="${esc(jp)}">🔊 Play</button>
      ${romaji ? `<button data-show="romaji">Aa Romaji</button>` : ""}
      ${en ? `<button data-show="en">🌐 Translate</button>` : ""}
    </div>
  </div>`;
}
function bindBubbles(root) {
  root.querySelectorAll("[data-say]").forEach(b => b.onclick = () => speak(b.dataset.say));
  root.querySelectorAll("[data-show]").forEach(b => b.onclick = () => {
    const el = b.closest(".bubble").querySelector("." + b.dataset.show);
    el.hidden = !el.hidden;
  });
}
function appendChat(html) {
  const chat = document.getElementById("chat");
  chat.insertAdjacentHTML("beforeend", html);
  bindBubbles(chat.lastElementChild);
  chat.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" });
}

// ---------- Scenario list ----------
async function renderSpeak() {
  const best = state.speak || {};
  const draw = () => {
    $view.innerHTML = `
      <h2>Speak</h2>
      <p class="muted">${Recognition
        ? "Role-play real situations out loud. Tap 🎤 and answer in Japanese, or type romaji if you can't use a mic."
        : `Role-play real situations. Listen to your partner with 🔊 and type your answer in Japanese or romaji. ${IN_CLAUDE ? "Voice input isn't available in the online version." : "For voice input, open the app in Chrome or Edge."}`}</p>
      ${SCENARIOS.map(sc => `
        <button class="card scenario" data-id="${sc.id}">
          <span class="emoji">${sc.emoji}</span>
          <span style="flex:1"><b>${esc(sc.title)}</b><span class="pill">${sc.level}</span>
            <small>${esc(sc.goal)}</small>
            ${best[sc.id] ? `<small>Best: ${best[sc.id]}%</small>` : ""}</span>
        </button>
        ${aiAvailable ? `<button class="btn secondary" style="margin:-6px 0 16px" data-ai="${sc.id}">🤖 Free talk with AI tutor</button>` : ""}
      `).join("")}`;
    $view.querySelectorAll("[data-id]").forEach(b => b.onclick = () => runScenario(SCENARIOS.find(s => s.id === b.dataset.id)));
    $view.querySelectorAll("[data-ai]").forEach(b => b.onclick = () => runAiChat(SCENARIOS.find(s => s.id === b.dataset.ai)));
  };
  draw();
  if (aiAvailable === null) { await checkAi(); if (currentTab === "speak" && aiAvailable) draw(); }
}
VIEWS.speak = renderSpeak;

function speakShell(sc, subtitle) {
  document.body.classList.add("in-lesson");
  $view.innerHTML = `<div class="lesson">
    <div class="lesson-top">
      <button class="icon-btn" id="quit" aria-label="Quit">✕</button>
      <div style="flex:1"><b>${sc.emoji} ${esc(sc.title)}</b><div class="muted" style="font-size:.85rem">${esc(subtitle)}</div></div>
    </div>
    <div class="chat" id="chat"></div>
    <div class="spacer"></div>
    <div id="hints" class="hints"></div>
    <div id="controls"></div>
  </div>`;
  document.getElementById("quit").onclick = () => { window.speechSynthesis?.cancel(); setTab("speak"); };
}

function answerControls(onAnswer, extraButtons = "") {
  const box = document.getElementById("controls");
  box.innerHTML = `
    <div class="answer-bar">
      <input class="type-input" id="typed" placeholder="Type in romaji or Japanese…" autocomplete="off" autocapitalize="off">
      ${Recognition ? `<button class="mic" id="mic" aria-label="Speak">🎤</button>` : `<button class="mic" id="send" aria-label="Send">➤</button>`}
    </div>
    ${extraButtons}`;
  const typed = document.getElementById("typed");
  const submitTyped = () => { const v = typed.value.trim(); if (v) { typed.value = ""; onAnswer([v]); } };
  typed.onkeydown = e => { if (e.key === "Enter") submitTyped(); };
  const send = document.getElementById("send");
  if (send) send.onclick = submitTyped;
  const mic = document.getElementById("mic");
  if (mic) mic.onclick = () => {
    if (typed.value.trim()) return submitTyped();
    window.speechSynthesis?.cancel();
    mic.classList.add("listening");
    listen(onAnswer, () => mic.classList.remove("listening"));
  };
}

// ---------- Scripted role-play ----------
function runScenario(sc) {
  speakShell(sc, `Talking with: ${sc.partner} · ${sc.goal}`);
  let turn = 0;
  const scores = [];

  const showTurn = () => {
    const [jp, romaji, en] = sc.turns[turn].npc;
    appendChat(bubble("npc", jp, romaji, en));
    speak(jp);
    const hints = document.getElementById("hints");
    hints.innerHTML = `<button class="btn secondary" id="showHints" style="padding:8px">💡 Show possible answers</button>`;
    document.getElementById("showHints").onclick = () => {
      hints.innerHTML = sc.turns[turn].answers.map(a =>
        `<button class="hint" data-jp="${esc(a[0])}">${esc(a[0])}<small>${esc(a[1])} — ${esc(a[2])}</small></button>`).join("");
      hints.querySelectorAll(".hint").forEach(h => h.onclick = () => speak(h.dataset.jp));
    };
    answerControls(handleAnswer);
  };

  const handleAnswer = heardList => {
    const { score, best, heard } = scoreAnswer(heardList, sc.turns[turn].answers);
    const pct = Math.round(score * 100);
    const cls = pct >= 75 ? "ok" : pct >= 50 ? "meh" : "bad";
    const label = pct >= 75 ? "Great!" : pct >= 50 ? "Close — keep practising" : "Not quite";
    appendChat(bubble("me", heard, "", "",
      `<div class="score ${cls}">${label} · ${pct}%</div>
       ${pct < 75 ? `<div class="sub">Try: <b>${esc(best[0])}</b> (${esc(best[1])})</div>` : ""}`));
    if (pct >= 50) {
      scores.push(pct);
      document.getElementById("hints").innerHTML = "";
      turn++;
      document.getElementById("controls").innerHTML = "";
      setTimeout(() => (turn < sc.turns.length ? showTurn() : finish()), 900);
    } else {
      answerControls(handleAnswer,
        `<button class="btn secondary" id="skip" style="margin-top:10px;padding:10px">Skip this line</button>`);
      document.getElementById("skip").onclick = () => {
        scores.push(pct); turn++;
        document.getElementById("hints").innerHTML = "";
        turn < sc.turns.length ? showTurn() : finish();
      };
    }
  };

  const finish = () => {
    const [jp, romaji, en] = sc.outro;
    appendChat(bubble("npc", jp, romaji, en));
    speak(jp);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    state.speak = state.speak || {};
    state.speak[sc.id] = Math.max(state.speak[sc.id] || 0, avg);
    const xp = 5 + Math.round(avg / 10);
    addXp(xp);
    document.getElementById("hints").innerHTML = "";
    document.getElementById("controls").innerHTML = `
      <div class="feedback ok">${avg >= 75 ? "🌸" : "💪"} Conversation complete! ${avg}% · +${xp} XP</div>
      <button class="btn" id="again">Practise again</button>
      <button class="btn secondary" id="back" style="margin-top:10px">Back to scenarios</button>`;
    document.getElementById("again").onclick = () => runScenario(sc);
    document.getElementById("back").onclick = () => setTab("speak");
  };

  showTurn();
}

// ---------- Optional AI tutor (needs server.js + API key) ----------
function runAiChat(sc) {
  speakShell(sc, `AI tutor plays: ${sc.partner} · say anything!`);
  const history = []; // { role: "user" | "assistant", text }
  let turns = 0;

  const ask = async () => {
    document.getElementById("controls").innerHTML = `<p class="typing">${esc(sc.partner)} is typing…</p>`;
    try {
      const data = await tutorTurn(sc, history);
      const fb = data.feedback;
      if (fb && history.length) {
        const last = document.querySelector("#chat .bubble.me:last-child");
        last?.insertAdjacentHTML("beforeend", fb.correct
          ? `<div class="score ok">✓ Natural Japanese!</div>`
          : `<div class="score meh">Better: ${esc(fb.corrected_jp)} (${esc(fb.corrected_romaji)})</div><div class="sub">${esc(fb.explanation)}</div>`);
      }
      history.push({ role: "assistant", text: data.reply.jp });
      appendChat(bubble("npc", data.reply.jp, data.reply.romaji, data.reply.en));
      speak(data.reply.jp);
      const hints = document.getElementById("hints");
      hints.innerHTML = (data.suggestions || []).length
        ? `<button class="btn secondary" id="showHints" style="padding:8px">💡 Ideas for what to say</button>` : "";
      const sh = document.getElementById("showHints");
      if (sh) sh.onclick = () => {
        hints.innerHTML = data.suggestions.map(a =>
          `<button class="hint" data-jp="${esc(a.jp)}">${esc(a.jp)}<small>${esc(a.romaji)} — ${esc(a.en)}</small></button>`).join("");
        hints.querySelectorAll(".hint").forEach(h => h.onclick = () => speak(h.dataset.jp));
      };
      answerControls(onAnswer, `<button class="btn secondary" id="end" style="margin-top:10px;padding:10px">End conversation</button>`);
      document.getElementById("end").onclick = () => { if (turns) addXp(5 + turns * 2); setTab("speak"); };
    } catch (e) {
      document.getElementById("controls").innerHTML =
        `<div class="feedback bad">${esc(e.message)}</div>
         <button class="btn" id="retry">Try again</button>
         <button class="btn secondary" id="back" style="margin-top:10px">Back</button>`;
      document.getElementById("retry").onclick = ask;
      document.getElementById("back").onclick = () => setTab("speak");
    }
  };

  const onAnswer = heardList => {
    const text = heardList[0];
    turns++;
    document.getElementById("hints").innerHTML = "";
    history.push({ role: "user", text });
    appendChat(bubble("me", text, "", ""));
    ask();
  };

  ask();
}
