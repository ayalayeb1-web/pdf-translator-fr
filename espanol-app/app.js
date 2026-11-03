"use strict";

// ---------- Persistence ----------
const STORE_KEY = "vamonos-v1";
const DAY = 86400000;
const SRS_INTERVALS = [0, 1, 2, 4, 8, 16, 32]; // days per box (Leitner)
const DAILY_GOAL = 30;

const today = () => new Date().toISOString().slice(0, 10);

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s) return s;
  } catch (_) { /* storage unavailable */ }
  return { xp: 0, streak: 0, lastDay: null, completed: {}, srs: {}, daily: {} };
}
let state = loadState();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
  document.getElementById("xp").textContent = state.xp;
  document.getElementById("streak").textContent = currentStreak();
}

function currentStreak() {
  if (!state.lastDay) return 0;
  const gap = Math.round((new Date(today()) - new Date(state.lastDay)) / DAY);
  return gap <= 1 ? state.streak : 0;
}

function addXp(n) {
  const t = today();
  if (state.lastDay !== t) {
    const gap = state.lastDay ? Math.round((new Date(t) - new Date(state.lastDay)) / DAY) : 99;
    state.streak = gap === 1 ? state.streak + 1 : 1;
    state.lastDay = t;
  }
  state.xp += n;
  state.daily[t] = (state.daily[t] || 0) + n;
  save();
}

// ---------- Spaced repetition ----------
function grade(itemId, correct) {
  const card = state.srs[itemId] || { box: 0, due: 0, seen: 0, right: 0 };
  card.seen++;
  if (correct) { card.right++; card.box = Math.min(card.box + 1, SRS_INTERVALS.length - 1); }
  else card.box = 1;
  card.due = Date.now() + SRS_INTERVALS[card.box] * DAY;
  state.srs[itemId] = card;
}
const dueItems = () => Object.entries(state.srs)
  .filter(([id, c]) => c.due <= Date.now() && ALL_ITEMS[id])
  .sort((a, b) => a[1].due - b[1].due)
  .map(([id]) => ALL_ITEMS[id]);
const mastered = id => (state.srs[id]?.box || 0) >= 4;

// ---------- Audio ----------
// One robust text-to-speech engine for the whole app. It works around common browser problems:
//  - iPhone/iPad only speak after a real tap → we "unlock" speech on the first touch;
//  - Chrome sometimes drops a line spoken right after cancel() → small delay after cancelling;
//  - utterances can be garbage-collected mid-speech → we keep a reference;
//  - voices load late → we keep re-checking for a Spanish (Spain) voice.
const TTS = (() => {
  const ok = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let voices = [], ja = null, unlocked = false, keep = [], timer = null;
  // Spanish voices, Spain (es-ES) first, then any other Spanish.
  const jaOnly = vs => {
    const es = vs.filter(v => /^es/i.test(v.lang || "") || /spanish|español/i.test(v.name || ""));
    return [...es.filter(v => /es[-_]ES/i.test(v.lang || "")), ...es.filter(v => !/es[-_]ES/i.test(v.lang || ""))];
  };
  // Prefer bright, female voices from Spain (they suit the cute style best).
  // How human a voice sounds: cloud / neural voices are far more natural than old desktop ones.
  const quality = v => {
    const n = (v.name || "").toLowerCase();
    let q = 0;
    if (/natural|neural|online|premium|enhanced|wavenet|studio/.test(n)) q += 100;
    if (/google/.test(n)) q += 60;
    if (v.localService === false) q += 15;
    if (/desktop|compact|espeak|mbrola/.test(n)) q -= 40;
    if (/elvira|ximena|abril|vera|monica|mónica|helena|laura|lucia|lucía|female/.test(n)) q += 5;
    if (/es[-_]ES/i.test(v.lang || "")) q += 30;
    return q;
  };
  const isNatural = v => !!v && quality(v) >= 60;
  const pickBest = vs => [...jaOnly(vs)].sort((a, b) => quality(b) - quality(a))[0] || null;
  // Small, natural shifts only: large pitch changes make synthetic voices sound robotic.
  const STYLES = { cute: { pitch: 1.12, rate: 0.03 }, gentle: { pitch: 1.05, rate: -0.05 }, natural: { pitch: 1, rate: 0 }, calm: { pitch: 0.96, rate: -0.08 } };
  const load = () => { if (!ok) return; try { voices = speechSynthesis.getVoices() || []; ja = pickBest(voices); } catch (_) {} };
  if (ok) {
    load();
    try { speechSynthesis.addEventListener("voiceschanged", load); } catch (_) { speechSynthesis.onvoiceschanged = load; }
    [300, 1000, 2500, 5000].forEach(t => setTimeout(load, t));
  }
  const unlock = () => {
    if (unlocked || !ok) return;
    unlocked = true;
    try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; u.lang = "es-ES"; speechSynthesis.speak(u); } catch (_) {}
  };
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });

  // character: true → Lía's own voice; otherwise the lesson voice style from settings.
  function speak(text, { rate = 0.9, pitch = 1, onend, character = false } = {}) {
    const style = STYLES[state.voiceStyle || "natural"] || STYLES.natural;
    if (character) {
      if (state.kitsuStyle === "gentle") { pitch = 1.06; rate = 0.9; } else { pitch = 1.16; rate = Math.max(rate, 1); }
    }
    else { pitch = Math.min(2, pitch * style.pitch); rate = Math.max(0.4, rate + style.rate); }
    const chosen = (state.ttsVoice && voices.find(v => v.name === state.ttsVoice)) || ja;
    let fired = false;
    const end = () => { if (!fired) { fired = true; onend?.(); } };
    if (!ok || !text) { setTimeout(end, 200); return false; }
    clearTimeout(timer);
    // Long text is read sentence by sentence with a short breath in between.
    const raw = text.length > 28 ? text.split(/(?<=[。！？!?…]|[.](?=\s))\s*/).map(t => t.trim()).filter(Boolean) : [text];
    // Keep very short pieces together ("¡Hola! ¡Soy Lía!") so speech doesn't sound choppy.
    const parts = raw.reduce((acc, t) => { const last = acc[acc.length - 1]; if (last !== undefined && (last.length < 14 || t.length < 6)) acc[acc.length - 1] = last + " " + t; else acc.push(t); return acc; }, []);
    let idx = 0;
    const go = () => {
      if (idx >= parts.length) return end();
      try {
        const u = new SpeechSynthesisUtterance(parts[idx++]);
        u.lang = (chosen && chosen.lang) || "es-ES"; u.rate = rate; u.pitch = pitch;
        if (chosen) u.voice = chosen;
        u.onend = () => { keep = keep.filter(x => x !== u); if (idx < parts.length) timer = setTimeout(go, 170); else end(); };
        u.onerror = () => { keep = keep.filter(x => x !== u); end(); };
        keep.push(u);
        if (speechSynthesis.paused) speechSynthesis.resume();
        speechSynthesis.speak(u);
      } catch (_) { end(); }
    };
    if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); timer = setTimeout(go, 90); } else go();
    setTimeout(end, 1800 + parts.length * 250 + text.length * 260 / rate);
    return true;
  }
  return {
    speak,
    cancel: () => { if (ok) { clearTimeout(timer); speechSynthesis.cancel(); } },
    status: () => { load(); return { supported: ok, voices: voices.length, ja: ja ? `${ja.name} (${ja.lang})` : null }; },
    list: () => { load(); return [...jaOnly(voices)].sort((a, b) => quality(b) - quality(a)); },
    current: () => { load(); return ((state.ttsVoice && voices.find(v => v.name === state.ttsVoice)) || ja)?.name || ""; },
    isNatural,
  };
})();
let jaVoice = null; // kept for older call sites; TTS picks the voice now

let voiceWarned = false;
function speak(text) {
  TTS.speak(text);
  if (!voiceWarned) setTimeout(() => {
    const st = TTS.status();
    if (!voiceWarned && (!st.supported || (st.voices > 0 && !st.ja))) {
      voiceWarned = true;
      toast(st.supported ? "No Spanish voice on this device. Open Me → Voice to fix it." : "This browser can't speak. Try Chrome or Safari.");
    }
  }, 1200);
}

// ---------- Helpers ----------
const $view = document.getElementById("view");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a).slice(0, n);
const normalize = s => s.toLowerCase().replace(/[^a-z]/g, "");
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2200);
}

// In-page confirmation dialog (the browser's built-in confirm box is blocked in some embeds).
function askConfirm(message, okLabel = "Yes") {
  return new Promise(resolve => {
    const wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
      <p>${esc(message)}</p>
      <button class="btn" id="modalOk">${esc(okLabel)}</button>
      <button class="btn secondary" id="modalCancel">Cancel</button></div>`;
    document.body.append(wrap);
    const done = v => { wrap.remove(); resolve(v); };
    wrap.querySelector("#modalOk").onclick = () => done(true);
    wrap.querySelector("#modalCancel").onclick = () => done(false);
    wrap.querySelector("#modalCancel").focus();
  });
}

function isUnlocked(unit, idx) {
  return idx === 0 || !!state.completed[unit.lessons[idx - 1].id];
}
const currentLevel = () => LEVELS.find(l => l.id === state.level) || LEVELS[0];
const lessonsOf = level => level.units.flatMap(u => u.lessons);

// ---------- AI-written lessons (B1–C2) ----------
state.aiLessons = state.aiLessons || {};

function applyAiLesson(lesson, data) {
  Object.assign(lesson, data, { generated: true });
  registerItems(lesson);
}
// Restore lessons generated in earlier visits.
LEVELS.forEach(l => l.units.forEach(u => u.lessons.forEach(ls => {
  if (ls.ai && state.aiLessons[ls.id]) applyAiLesson(ls, state.aiLessons[ls.id]);
})));

function lessonPrompt(lesson) {
  const level = LEVELS.find(l => l.id === lesson.level);
  if (lesson.type === "reading") return `You are writing one reading lesson of a Castilian Spanish (Spain) course for English speakers.
Level: CEFR ${level.id} (${level.jlpt}, ${level.name}). Text type: ${lesson.point}.

Reply with only one JSON object, in exactly this shape:
{
 "tokens": [{"t": "one word, with any punctuation attached", "r": "", "en": "short English meaning of the word in context"}],
 "translation": "natural English translation of the whole text",
 "questions": [{"q": "comprehension question in English", "options": ["4", "short", "English", "options"], "answer": "the correct option"}]
}
Rules:
- The text is 5-8 sentences of natural, correct peninsular Spanish (Spain: vosotros, Spain vocabulary) at this level.
- One token per word, punctuation attached to the word before or after it. Joined with spaces, the tokens give the full text.
- 4 comprehension questions; exactly one option is correct.`;
  return `You are writing one lesson of a Castilian Spanish (Spain) course for English speakers.
Level: CEFR ${level.id} (${level.jlpt}, ${level.name}).
Lesson: "${lesson.title}". Grammar point / skill: ${lesson.point}.

Reply with only one JSON object, in exactly this shape:
{
 "explain": "3-5 plain-English sentences: what it means, how to form it (which verb/adjective/noun forms it attaches to), and any nuance or common confusion.",
 "examples": [{"jp": "Spanish sentence", "en": "English"}],
 "vocab": [{"jp": "Spanish word (nouns with el/la)", "en": "English"}],
 "exercises": [
  {"fill": "Spanish sentence with exactly one ＿ where the target form goes", "options": ["4", "short", "answer", "choices"], "answer": "the one correct option", "en": "English translation of the full sentence"},
  {"order": ["3 to 8", "tiles", "in the", "correct order"], "en": "English translation"}
 ]
}
Rules:
- 4 examples, 5 vocab words that appear in the examples, 5 fill exercises and 2 order exercises.
- Natural, correct peninsular Spanish (Spain) at this level: use vosotros for informal plural and Spain vocabulary (coche, móvil, ordenador, zumo).
- In fill exercises exactly one option is correct; the other three are plausible mistakes (other forms or similar grammar). The ＿ is the full-width character U+FF3F.
- Order tiles are single words; joined with spaces in order they form the full sentence.`;
}

function cleanAiLesson(lesson, raw) {
  const str = v => (typeof v === "string" ? v.trim() : "");
  if (lesson.type === "reading") {
    const tokens = (raw.tokens || []).map(t => ({ t: str(t.t), r: str(t.r) !== str(t.t) ? str(t.r) : "", en: str(t.en) })).filter(t => t.t);
    const questions = (raw.questions || []).map(q => ({ q: str(q.q), options: (q.options || []).map(str).filter(Boolean), answer: str(q.answer) }))
      .filter(q => q.q && q.options.length >= 2 && q.options.includes(q.answer));
    if (tokens.length < 15 || questions.length < 2) throw new Error("incomplete");
    return { tokens, translation: str(raw.translation), questions };
  }
  const examples = (raw.examples || []).map(e => [str(e.jp), "", str(e.en)]).filter(e => e[0] && e[2]);
  const exercises = (raw.exercises || []).map(e => {
    if (e.fill) {
      const options = (e.options || []).map(str).filter(Boolean);
      const answer = str(e.answer);
      if (!str(e.fill).includes("＿") || options.length < 2 || !options.includes(answer)) return null;
      return { fill: str(e.fill), options, answer, en: str(e.en) };
    }
    if (Array.isArray(e.order)) {
      const tiles = e.order.map(str).filter(Boolean);
      return tiles.length >= 3 && tiles.length <= 10 ? { order: tiles, en: str(e.en) } : null;
    }
    return null;
  }).filter(Boolean);
  const items = (raw.vocab || []).map(v => ({
    id: `vocab:${str(v.jp)}`, jp: str(v.jp), romaji: str(v.jp), en: str(v.en),
  })).filter(v => v.jp && v.en);
  if (!str(raw.explain) || examples.length < 2 || exercises.length < 3) throw new Error("incomplete");
  return { explain: str(raw.explain), examples, exercises, items };
}

async function generateLesson(lesson) {
  document.body.classList.add("in-lesson");
  $view.innerHTML = `<div class="lesson done">
    <div class="emoji">✍️</div>
    <h2>Writing your lesson…</h2>
    ${Mascot.bubbleHtml({ jp: "¡Un momentito!", en: "Give me a moment — writing your lesson!" }, "wink", 90, "finish-kitsu")}
    <p class="muted">${esc(lesson.point)}</p>
    <p>Lía is preparing ${lesson.type === "reading" ? "a reading passage and questions" : "explanations, examples and exercises"}. This takes up to a minute, and only happens once.</p>
    <div class="spacer"></div>
    <button class="btn secondary" id="cancelGen">Cancel</button>
  </div>`;
  const ctl = new AbortController();
  document.getElementById("cancelGen").onclick = () => { ctl.abort(); setTab("home"); };
  const fail = msg => {
    if (ctl.signal.aborted) return;
    $view.innerHTML = `<div class="lesson done">
      <div class="emoji">😕</div><h2>Couldn't write this lesson</h2><p>${esc(msg)}</p>
      <div class="spacer"></div>
      <button class="btn" id="retryGen">Try again</button>
      <button class="btn secondary" id="backGen" style="margin-top:10px">Back</button></div>`;
    document.getElementById("retryGen").onclick = () => generateLesson(lesson);
    document.getElementById("backGen").onclick = () => setTab("home");
  };
  if (!(await checkAi()) || !sampleFn) {
    return fail("Lessons from B1 up are written by AI, which needs the online version of the app (opened in claude.ai).");
  }
  try {
    const raw = await sampleFn.json(lessonPrompt(lesson), { signal: ctl.signal, cache: false });
    const data = cleanAiLesson(lesson, raw);
    state.aiLessons[lesson.id] = data;
    applyAiLesson(lesson, data);
    save();
    if (!ctl.signal.aborted) startLesson(lesson);
  } catch (e) {
    if (e?.code === "cancelled") return;
    fail({
      not_granted: "The app needs your permission to use Claude. Reload the page to be asked again.",
      sampling_disabled: "Claude isn't available on this account.",
      rate_limited: "You've hit a usage limit. Wait a bit, then try again.",
    }[e?.code] || "The lesson came back incomplete. Try again.");
  }
}

// ---------- Views ----------
let currentTab = "home";
const TAB_ORDER = ["home", "watch", "speak", "review", "chart", "profile", "notes"];

// Smoothly swap what's on screen: slide/fade the old view out, render, slide the new one in.
let swapToken = 0;
function swapView(render, dir = 1) {
  const token = ++swapToken;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finish = () => {
    if (token !== swapToken) return;
    render();
    $view.querySelectorAll(".stagger").forEach(el => [...el.children].forEach((c, i) => c.style.setProperty("--i", i)));
    if (!reduce && $view.animate) $view.animate(
      [{ opacity: 0, transform: `translateX(${28 * dir}px) scale(.985)` }, { opacity: 1, transform: "none" }],
      { duration: 340, easing: "cubic-bezier(.2,.8,.2,1)" });
  };
  if (reduce || !$view.animate || !$view.firstElementChild) return finish();
  const out = $view.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-22 * dir}px) scale(.99)` }],
    { duration: 150, easing: "ease-in", fill: "forwards" });
  out.onfinish = () => { finish(); out.cancel(); };
}

function moveTabInk() {
  const active = document.querySelector("#tabs button.active"), ink = document.querySelector(".tab-ink");
  if (active && ink) { ink.style.width = active.offsetWidth - 12 + "px"; ink.style.transform = `translateX(${active.offsetLeft + 6}px)`; }
}
// Lantern badges on the dock: cards due in Review, a dot on Speak until today's mission is done.
function updateTabBadges() {
  const due = dueItems().length + (typeof sayDue === "function" ? sayDue().length : 0);
  const badge = document.getElementById("badgeReview");
  if (badge) { badge.hidden = !due; badge.textContent = due > 99 ? "99+" : due; }
  const dot = document.getElementById("dotSpeak");
  if (dot) dot.hidden = !!state.missions?.[today()]?.done;
}
// A little burst of sakura petals from a tapped dock button.
function petalBurst(btn) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (let i = 0; i < 6; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    const a = (-150 + i * 24 + Math.random() * 14) * Math.PI / 180, d = 26 + Math.random() * 18;
    p.style.setProperty("--x", Math.cos(a) * d + "px"); p.style.setProperty("--y", Math.sin(a) * d + "px");
    p.style.setProperty("--r", Math.random() * 360 + "deg");
    btn.append(p); setTimeout(() => p.remove(), 750);
  }
}
document.getElementById("tabs").addEventListener("pointerdown", e => {
  const b = e.target.closest("button"); if (!b) return;
  petalBurst(b);
  const icon = b.querySelector(".ti"); icon.classList.remove("tap"); void icon.offsetWidth; icon.classList.add("tap");
});

function setTab(tab) {
  const dir = TAB_ORDER.indexOf(tab) >= TAB_ORDER.indexOf(currentTab) ? 1 : -1;
  updateTabBadges();
  currentTab = tab;
  if (typeof stopAmbient === "function") stopAmbient();
  document.body.classList.remove("in-lesson");
  const navTab = tab === "notes" ? "profile" : tab;
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === navTab));
  if (typeof closePlayer === "function") closePlayer();
  moveTabInk();
  swapView(() => { $view.scrollTop = 0; VIEWS[tab](); }, dir);
}
window.addEventListener("resize", moveTabInk);
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (b) setTab(b.dataset.tab);
});

function renderReview() {
  const due = dueItems();
  const total = Object.keys(state.srs).length;
  $view.innerHTML = `
    <h2>Review</h2>
    <div class="card">
      <p>Spaced repetition brings back each card just before you'd forget it. Get it right and it waits longer; miss it and it comes back soon.</p>
      <p><b>${due.length}</b> due now · <b>${total}</b> cards learned</p>
      <button class="btn" id="go" ${due.length ? "" : "disabled"}>${due.length ? "Start review" : "All caught up 🎉"}</button>
    </div>
    ${total ? "" : `<p class="muted">Finish a lesson to add cards to your review deck.</p>`}`;
  const go = document.getElementById("go");
  if (due.length) go.onclick = () => startSession({ title: "Review", items: due.slice(0, 15), review: true });
}

function renderProfile() {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { label: d.toLocaleDateString(undefined, { weekday: "short" }), xp: state.daily[key] || 0 };
  });
  const max = Math.max(DAILY_GOAL, ...days.map(d => d.xp));
  const cards = Object.values(state.srs);
  const seen = cards.reduce((a, c) => a + c.seen, 0);
  const acc = seen ? Math.round(100 * cards.reduce((a, c) => a + c.right, 0) / seen) : 0;
  const verbsKnown = Object.keys(state.conj || {}).filter(k => (state.conj[k].box || 0) >= 3).length;
  const wordsKnown = Object.keys(state.srs).filter(id => id.startsWith("vocab:") && mastered(id)).length;
  $view.innerHTML = `
    <h2>Progress</h2>
    <div class="done-stats">
      <div class="card"><b>🔥 ${currentStreak()}</b>day streak</div>
      <div class="card"><b>⭐ ${state.xp}</b>total XP</div>
    </div>
    <div class="card">
      <b>This week</b>
      <div class="week" style="margin-top:12px">${days.map(d =>
        `<div><div class="bar" style="height:${d.xp / max * 80}px"></div>${d.label}</div>`).join("")}</div>
    </div>
    <div class="card">
      <b>Levels</b>
      ${LEVELS.map(l => {
        const all = lessonsOf(l); const done = all.filter(x => state.completed[x.id]).length;
        return `<div class="row-list"><span>${l.id} · ${esc(l.name)} <span class="muted">(${l.jlpt})</span></span><b>${done}/${all.length}</b></div>`;
      }).join("")}
    </div>
    <div class="card">
      <div class="row-list"><span>📚 Words mastered</span><b>${wordsKnown}</b></div>
      <div class="row-list"><span>🔥 Verb forms mastered</span><b>${verbsKnown}</b></div>
      <div class="row-list"><span>🎯 Review accuracy</span><b>${acc}%</b></div>
    </div>
    <button class="card notes-entry" id="openNotes"><span>📝 <b>My notes</b></span><span class="muted">${Object.keys(state.notes || {}).length} notes →</span></button>
    <div class="card voice-test">
      <b>🔊 Voice</b>
      <p class="muted" style="margin:6px 0 10px">Can't hear Lía or the lessons? Tap the button and check what it says below.</p>
      <p style="margin:4px 0 6px;font-weight:800">Lía's personality</p>
      <div class="voice-styles two">${[["cheerful", "☀️", "Cheerful"], ["gentle", "🌙", "Gentle & polite"]].map(([k, ic, l]) =>
        `<button class="vstyle ${(state.kitsuStyle || "cheerful") === k ? "active" : ""}" data-kitsu="${k}"><span>${ic}</span>${l}</button>`).join("")}</div>
      <p style="margin:14px 0 6px;font-weight:800">Lesson voice</p>
      <div class="voice-styles four">${[["cute", "🌸", "Cute"], ["gentle", "🌙", "Gentle"], ["natural", "🎙️", "Natural"], ["calm", "🍵", "Calm"]].map(([k, ic, l]) =>
        `<button class="vstyle ${(state.voiceStyle || "natural") === k ? "active" : ""}" data-style="${k}"><span>${ic}</span>${l}</button>`).join("")}</div>
      <p class="muted" style="font-size:.8rem;margin:6px 0 10px">How words and sentences sound in lessons. Lía's own voice follows her personality. Natural is best for copying real pronunciation.</p>
      ${(() => {
        const vs = TTS.list(), cur = TTS.current();
        if (!vs.length) return "";
        const tip = !TTS.isNatural(vs[0]) ? `<div class="voice-tip">🤖 The voices on this device sound robotic. For a natural, human voice, open this app in <b>Microsoft Edge</b> (free natural voices) or <b>Google Chrome</b>.</div>` : "";
        return `${tip}<p style="margin:14px 0 6px;font-weight:800">Voices on this device <small class="muted">tap to try</small></p>
          <div class="voice-list">${vs.slice(0, 8).map(v => `<button class="voice-row ${v.name === cur ? "on" : ""}" data-voice="${esc(v.name)}">
            <span class="vr-name">${esc(v.name)}</span><span class="vr-badge ${TTS.isNatural(v) ? "nat" : "rob"}">${TTS.isNatural(v) ? "✨ Natural" : "🤖 Robotic"}</span></button>`).join("")}</div>`;
      })()}
      <div class="tr-actions"><button class="btn" id="testVoice">🔊 Lesson voice</button><button class="btn secondary" id="testKitsu">🐾 Lía</button></div>
      <div id="voiceDiag"></div>
    </div>
    <div class="card">
      <b>Settings</b>
      <label class="toggle-row" for="optVoice"><span>🐾 Lía speaks out loud</span><input type="checkbox" id="optVoice" ${state.voice !== false ? "checked" : ""}></label>
      <label class="toggle-row" for="optAuto"><span>⚡ Auto-check &amp; next</span><input type="checkbox" id="optAuto" ${state.autoNext !== false ? "checked" : ""}></label>
      <label class="toggle-row" for="optSfx"><span>🔔 Sound effects</span><input type="checkbox" id="optSfx" ${state.sfx !== false ? "checked" : ""}></label>
    </div>
    <button class="btn secondary" id="reset">Reset progress</button>`;
  document.getElementById("openNotes").onclick = () => setTab("notes");
  $view.querySelectorAll("[data-style]").forEach(b => b.onclick = () => {
    state.voiceStyle = b.dataset.style; save();
    $view.querySelectorAll("[data-style]").forEach(x => x.classList.toggle("active", x === b));
    TTS.speak("¡Hola! ¿Aprendemos español juntos?", { rate: 0.95 });
  });
  $view.querySelectorAll("[data-voice]").forEach(b => b.onclick = () => {
    state.ttsVoice = b.dataset.voice; save();
    $view.querySelectorAll("[data-voice]").forEach(x => x.classList.toggle("on", x === b));
    TTS.speak("¿Qué te parece esta voz?", { rate: 0.95 });
  });
  $view.querySelectorAll("[data-kitsu]").forEach(b => b.onclick = () => {
    state.kitsuStyle = b.dataset.kitsu; save();
    $view.querySelectorAll("[data-kitsu]").forEach(x => x.classList.toggle("active", x === b));
    Mascot.voice(b.dataset.kitsu === "gentle"
      ? { jp: "Muy bien. A partir de ahora, te enseñaré con calma.", en: "Very well. From now on, I'll teach you calmly." }
      : { jp: "¡Vamos allá! ¡Con mucha energía!", en: "Let's go! With lots of energy!" });
  });
  document.getElementById("testKitsu").onclick = () => TTS.speak(state.kitsuStyle === "gentle" ? "Hola, soy Lía. Vamos a aprender juntos, poco a poco." : "¡Hola! ¡Soy Lía! ¿Vamos a aprender español?", { character: true });
  document.getElementById("testVoice").onclick = () => {
    TTS.speak("¡Hola! Soy Lía, la lince. ¿Me oyes bien?", { rate: 0.95 });
    setTimeout(() => voiceDiagnosis(document.getElementById("voiceDiag")), 700);
  };
  document.getElementById("optVoice").onchange = e => { state.voice = e.target.checked; save(); };
  document.getElementById("optAuto").onchange = e => { state.autoNext = e.target.checked; save(); };
  document.getElementById("optSfx").onchange = e => { state.sfx = e.target.checked; save(); if (e.target.checked) Mascot.sfx("right"); };

  document.getElementById("reset").onclick = () => {
    askConfirm("Erase all progress? This can't be undone.", "Erase").then(ok => {
      if (ok) { state = { xp: 0, streak: 0, lastDay: null, completed: {}, srs: {}, daily: {}, aiLessons: state.aiLessons, notes: state.notes }; save(); renderProfile(); }
    });
  };
}

// Explains why there may be no sound, with steps for the viewer's device.
function voiceDiagnosis(box) {
  const st = TTS.status(), ua = navigator.userAgent;
  const device = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios"
    : /Android/.test(ua) ? "android" : /Windows/.test(ua) ? "windows" : /Macintosh/.test(ua) ? "mac" : "other";
  const steps = {
    ios: ["Flip the <b>silent switch</b> on the side of your iPhone off (silent mode mutes this voice) and turn the volume up.",
      "Settings → Accessibility → Spoken Content → Voices → <b>Spanish (Spain)</b> → download a voice (for example Mónica).",
      "Close and reopen the app page."],
    android: ["Turn the <b>media volume</b> up.",
      "Settings → System → Languages &amp; input → <b>Text-to-speech output</b> → choose <b>Speech Services by Google</b>.",
      "Tap ⚙️ next to it → Install voice data → <b>Spanish (Spain)</b> → download.",
      "Close the browser completely and reopen the page."],
    windows: ["Turn the volume up.", "Settings → Time &amp; language → Speech → <b>Add voices</b> → Spanish (Spain).", "Restart the browser. Microsoft Edge has free natural voices from Spain (Elvira, Ximena)."],
    mac: ["Turn the volume up.", "System Settings → Accessibility → Spoken Content → System voice → Manage voices → <b>Spanish (Spain)</b> (Mónica).", "Restart the browser."],
    other: ["Turn the volume up.", "Use Chrome, Edge or Safari, and install a Spanish (Spain) text-to-speech voice in your system settings."],
  }[device];
  box.innerHTML = `<div class="diag">
    <div class="diag-row"><span>Speech in this browser</span><b class="${st.supported ? "good" : "bad"}">${st.supported ? "✓ supported" : "✗ not supported"}</b></div>
    <div class="diag-row"><span>Voices found</span><b>${st.voices}</b></div>
    <div class="diag-row"><span>Spanish voice</span><b class="${st.ja ? "good" : "bad"}">${st.ja ? "✓ " + esc(st.ja) : "✗ not found"}</b></div>
    <p style="margin:12px 0 6px"><b>${st.ja ? "Still silent? Check these:" : "Install a Spanish (Spain) voice:"}</b></p>
    <ol class="diag-steps">${steps.map(x => `<li>${x}</li>`).join("")}</ol>
  </div>`;
}

// ---------- Lessons & quiz engine ----------
function startLesson(lesson) {
  if (lesson.ai && !lesson.generated) return generateLesson(lesson);
  startSession({ title: lesson.title, items: lesson.items || [], lesson, intro: true });
}

function makeQuestions(items, perItem) {
  const kinds = ["meaning", "reverse", "listen", "type"];
  const qs = [];
  items.forEach(it => sample(kinds, perItem).forEach(kind => qs.push({ item: it, kind })));
  return qs;
}

function distractors(item, n) {
  const pool = Object.values(ALL_ITEMS).filter(i => i.type === item.type && i.id !== item.id
    && i.id.split(":")[0] === item.id.split(":")[0] && i.romaji !== item.romaji && i.en !== item.en);
  return sample(pool, n);
}

function startSession(opts) {
  document.body.classList.add("in-lesson");
  if (typeof stopAmbient === "function") stopAmbient();
  const lesson = opts.lesson;
  const items = opts.items.map(i => ALL_ITEMS[i.id] || i);
  const isGrammar = lesson?.type === "grammar";
  const isReading = lesson?.type === "reading";
  const intro = [];
  if (isReading) intro.push({ reading: lesson });
  else if (opts.intro) {
    if (isGrammar) intro.push({ grammar: lesson });
    items.forEach(it => intro.push({ item: it }));
  }
  const queue = isReading ? lesson.questions.map(ex => ({ kind: "mc", ex }))
    : isGrammar ? [...lesson.exercises.map(ex => ({ kind: ex.fill ? "fill" : "order", ex })), ...makeQuestions(items, 1)]
    : makeQuestions(items, opts.review ? 1 : 2);
  const s = { ...opts, items, intro, introIdx: 0, queue: isReading ? queue : shuffle(queue), answered: 0, correct: 0, retries: 0, combo: 0, bestCombo: 0 };
  s.total = s.queue.length;
  swapView(() => (intro.length ? renderIntro(s) : renderQuestion(s)));
}

function lessonHeader(s, pct) {
  return `<div class="lesson-top">
    <button class="icon-btn" id="quit" aria-label="Quit">✕</button>
    <div class="progress"><div style="width:${pct}%"></div></div>
    ${s.combo >= 2 ? `<span class="combo">🔥${s.combo}</span>` : ""}
    ${s.lesson ? `<button class="icon-btn" id="noteBtn" aria-label="My notes for this lesson">📝</button>` : ""}
  </div>`;
}
function videoLink(query, label) {
  return `<a class="video-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(query)}" target="_blank" rel="noopener">▶ ${esc(label)}</a>`;
}
function bindQuit(s) {
  const nb = document.getElementById("noteBtn");
  if (nb && s?.lesson) nb.onclick = () => openNote(s.lesson.id, s.lesson.title);
  document.getElementById("quit").onclick = () => {
    askConfirm("Quit this lesson? Progress in it will be lost.", "Quit").then(ok => {
      if (ok) { TTS.cancel(); setTab(currentTab); }
    });
  };
}

function itemCardHtml(it) {
  const kind = /^(el|la|los|las) /i.test(it.jp) ? "noun" : / /.test(it.jp) ? "phrase" : "word";
  const sub = `<span class="romaji">${esc(it.en)}</span>${articleHint(it.jp)}`;
  return `<div class="prompt">New ${kind}</div>
    <div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>
    <div class="card-actions">
      <button class="speak" data-say="${esc(it.jp)}" aria-label="Play audio">🔊</button>
      <button class="speak" data-slow="${esc(it.jp)}" aria-label="Play slowly">🐢</button>
    </div>
    <div class="intro-meta">${sub}</div>
`;
}
// Small gender hint for nouns: el = masculine, la = feminine.
function articleHint(es) {
  const m = es.match(/^(el|la|los|las) /i);
  if (!m) return "";
  const g = /^(el|los)$/i.test(m[1]) ? ["masc", "masculine"] : ["fem", "feminine"];
  return `<div><span class="gender ${g[0]}">${g[1]}${/^los|las$/i.test(m[1]) ? " · plural" : ""}</span></div>`;
}

function readingCardHtml(lesson) {
  return `<div class="prompt">${esc(lesson.title)}</div>
    <div class="reading-tools">
      <button class="chip-btn" id="readAll">🔊 Listen</button>
      <button class="chip-btn" id="readSlow">🐢 Slowly</button>
      <button class="chip-btn" id="toggleTr">Translation</button>
    </div>
    <p class="muted" style="margin:6px 0">Tap any word to see what it means.</p>
    <div class="passage es">${lesson.tokens.map((t, i) => t.en
      ? `<button class="tok" data-i="${i}">${esc(t.t)}</button>`
      : `<span class="punct">${esc(t.t)}</span>`).join(" ")}</div>
    <div class="gloss" id="gloss" hidden></div>
    <p class="translation" id="tr" hidden>${esc(lesson.translation || "")}</p>`;
}

function grammarCardHtml(lesson) {
  return `<div class="prompt">${esc(lesson.title)}</div>
    <div class="point">${esc(lesson.point)}</div>
    <div>${videoLink(`Spanish grammar ${lesson.point.split(/[:·(]/)[0].trim()} explained Spain`, "Video lessons on this grammar")}</div>
    <p class="explain">${esc(lesson.explain)}</p>
    <div class="examples stagger">${lesson.examples.map(([jp, romaji, en]) => `
      <button class="example" data-say="${esc(jp)}">
        <span class="ex-jp">🔊 ${esc(jp)}</span>${romaji ? `<span class="ex-ro">${esc(romaji)}</span>` : ""}<span class="ex-en">${esc(en)}</span>
      </button>`).join("")}</div>`;
}

function renderIntro(s) {
  const card = s.intro[s.introIdx];
  const last = s.introIdx === s.intro.length - 1;
  $view.innerHTML = `<div class="lesson">
    ${lessonHeader(s, (s.introIdx / s.intro.length) * 30)}
    ${card.reading ? readingCardHtml(card.reading) : card.grammar ? grammarCardHtml(card.grammar) : itemCardHtml(card.item)}
    <div class="spacer"></div>
    <button class="btn" id="next">${card.reading ? "Answer the questions" : last ? "Start practice" : "Next"}</button>
  </div>`;
  bindQuit(s);
  $view.querySelectorAll("[data-say]").forEach(b => b.onclick = () => speak(b.dataset.say));
  $view.querySelectorAll("[data-slow]").forEach(b => b.onclick = () => TTS.speak(b.dataset.slow, { rate: 0.6 }));
  if (card.reading) {
    const lesson = card.reading;
    document.getElementById("readAll").onclick = () => speak(lesson.tokens.map(t => t.t).join(" "));
    document.getElementById("readSlow").onclick = () => TTS.speak(lesson.tokens.map(t => t.t).join(" "), { rate: 0.65 });
    document.getElementById("toggleTr").onclick = () => { const tr = document.getElementById("tr"); tr.hidden = !tr.hidden; };
    $view.querySelectorAll(".tok").forEach(b => b.onclick = () => {
      const t = lesson.tokens[b.dataset.i];
      $view.querySelectorAll(".tok.on").forEach(x => x.classList.remove("on")); b.classList.add("on");
      const g = document.getElementById("gloss");
      g.hidden = false;
      const word = t.t.replace(/[¿?¡!.,;:"«»()]/g, "");
      g.innerHTML = `<button class="speak small" aria-label="Play">🔊</button><div><b>${esc(word)}</b><div>${esc(t.en)}</div></div>`;
      g.querySelector("button").onclick = () => speak(word);
      speak(word);
    });
  }
  if (card.item) speak(card.item.jp);
  document.getElementById("next").onclick = () => {
    s.introIdx++;
    swapView(() => (s.introIdx < s.intro.length ? renderIntro(s) : renderQuestion(s)));
  };
}

// Accept any of the readings listed as "a / b".
// Accept the Spanish with or without its article (el gato / gato) and without accents, but say so.
function spanishMatch(typed, es) {
  const t = foldEs(typed), full = foldEs(es), bare = full.replace(/^(el|la|los|las) /, "");
  const ok = es.split("/").some(v => { const f = foldEs(v), b = f.replace(/^(el|la|los|las) /, ""); return t === f || t === b; }) || t === full || t === bare;
  const exactAccents = typed.trim().toLowerCase().replace(/[¿?¡!.,]/g, "") === es.toLowerCase().replace(/[¿?¡!.,]/g, "") ||
    typed.trim().toLowerCase() === es.toLowerCase().replace(/^(el|la|los|las) /, "");
  return { ok, accentNote: ok && !exactAccents && /[áéíóúüñ]/i.test(es) };
}

// Auto-continue: after an answer is checked, move on by itself (a bar fills on the button).
// Right answers wait ~1.3s, wrong ones ~2.8s so there's time to read the correction. Tapping skips.
function autoAdvance(btn, ok, go) {
  if (state.autoNext === false || !btn) return;
  const ms = ok ? 1300 : 2800;
  btn.style.setProperty("--ms", ms + "ms");
  btn.classList.remove("auto"); void btn.offsetWidth; btn.classList.add("auto");
  const t = setTimeout(() => { if (document.body.contains(btn)) go(); }, ms);
  btn.addEventListener("click", () => clearTimeout(t), { once: true });
}
const autoCheckOn = () => state.autoNext !== false;

function renderQuestion(s) {
  if (!s.queue.length) return finishSession(s);
  const q = s.queue[0];
  const it = q.item;
  const base = s.intro.length ? 30 : 0;
  const pct = base + (s.answered / (s.total + s.retries)) * (100 - base);
  let body = "", answerCheck, answerText, sayAfter, rightId;

  if (q.kind === "mc") {
    const ex = q.ex;
    body = `<div class="prompt">${esc(ex.q)}</div>
      <button class="chip-btn" id="rereadBtn" style="margin-bottom:6px">📖 Show the text</button>
      <div class="passage small" id="reread" hidden>${s.lesson.tokens.map(t => esc(t.t)).join(" ")}</div>
      <div class="choices one-col stagger">${shuffle(ex.options).map(o => `<button class="choice" data-id="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    rightId = ex.answer;
    answerCheck = () => s.selected === ex.answer;
    answerText = ex.answer;
  } else if (q.kind === "fill") {
    const ex = q.ex;
    const opts = shuffle(ex.options);
    body = `<div class="prompt">Fill in the blank</div>
      <div class="sentence">${esc(ex.fill).replace("＿", '<span class="blank">＿＿</span>')}</div>
      ${ex.en ? `<p class="muted">${esc(ex.en)}</p>` : ""}
      <div class="choices stagger">${opts.map(o => `<button class="choice" data-id="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    rightId = ex.answer;
    answerCheck = () => s.selected === ex.answer;
    answerText = ex.fill.replace("＿", ex.answer).replace(/\(.*?\)|（.*?）/g, "").trim();
    sayAfter = answerText;
  } else if (q.kind === "order") {
    const ex = q.ex;
    s.picked = [];
    let pool = shuffle(ex.order.map((t, i) => ({ t, i })));
    if (pool.every((p, i) => p.i === i) && pool.length > 1) pool = [...pool.slice(1), pool[0]];
    s.pool = pool;
    body = `<div class="prompt">Build the sentence</div>
      <p class="muted">${esc(ex.en)}</p>
      <div class="answer-line" id="line"></div>
      <div class="tiles stagger" id="pool"></div>`;
    answerCheck = () => s.picked.map(p => p.t).join(" ") === ex.order.join(" ");
    answerText = ex.order.join(" ");
    sayAfter = answerText;
  } else if (q.kind === "type") {
    body = `<div class="prompt">Write it in Spanish</div>
      <div class="big word en-prompt">${esc(it.en)}</div>
      <input class="type-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" lang="es" placeholder="Type the Spanish…">
      <div class="accent-keys">${["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"].map(c => `<button class="akey" data-c="${c}">${c}</button>`).join("")}</div>`;
    answerCheck = () => {
      const r = spanishMatch(document.getElementById("ans").value, it.jp);
      s.accentNote = r.accentNote;
      return r.ok;
    };
  } else {
    const isKana = it.type === "kana";
    const opts = shuffle([it, ...distractors(it, 3)]);
    let prompt, show, label;
    if (q.kind === "meaning") {
      prompt = isKana ? "What sound is this?" : "What does this mean?";
      show = `<div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>`;
      label = o => isKana ? o.romaji : o.en;
    } else if (q.kind === "reverse") {
      prompt = isKana ? `Which one is “${esc(it.romaji)}”?` : `Which one means “${esc(it.en)}”?`;
      show = "";
      label = o => o.jp;
    } else {
      prompt = "What do you hear?";
      show = `<button class="speak" id="say" aria-label="Play audio" style="margin-top:20px">🔊</button>`;
      label = o => o.jp;
    }
    body = `<div class="prompt">${prompt}</div>${show}
      <div class="choices stagger">${opts.map(o => `<button class="choice" data-id="${esc(o.id)}">${esc(label(o))}</button>`).join("")}</div>`;
    rightId = it.id;
    answerCheck = () => s.selected === it.id;
  }
  if (it) {
    answerText = `${it.jp} = ${it.en}`;
    sayAfter = it.jp;
  }

  $view.innerHTML = `<div class="lesson">
    ${lessonHeader(s, pct)}
    ${body}
    <div class="spacer"></div>
    <div id="fb"></div>
    <button class="btn" id="check" disabled>Check</button>
  </div>`;
  bindQuit(s);
  const check = document.getElementById("check");
  s.selected = null;
  const rr = document.getElementById("rereadBtn");
  if (rr) rr.onclick = () => { const p = document.getElementById("reread"); p.hidden = !p.hidden; };

  if (q.kind === "listen") { speak(sayAfter); document.getElementById("say").onclick = () => speak(sayAfter); }
  if (q.kind === "type") {
    const input = document.getElementById("ans");
    input.focus();
    input.oninput = () => {
      check.disabled = !input.value.trim();
      if (autoCheckOn() && !check.dataset.done && input.value.trim() && answerCheck()) check.click();
    };
    input.onkeydown = e => { if (e.key === "Enter" && !check.disabled) check.click(); };
    $view.querySelectorAll(".akey").forEach(k => k.onclick = () => {
      const pos = input.selectionStart ?? input.value.length;
      input.value = input.value.slice(0, pos) + k.dataset.c + input.value.slice(input.selectionEnd ?? pos);
      input.focus(); input.setSelectionRange(pos + 1, pos + 1); check.disabled = !input.value.trim();
    });
  }
  if (q.kind === "order") {
    const drawTiles = () => {
      const line = document.getElementById("line"), pool = document.getElementById("pool");
      line.innerHTML = s.picked.map((p, i) => `<button class="tile" data-from="line" data-i="${i}">${esc(p.t)}</button>`).join("");
      pool.innerHTML = s.pool.map((p, i) => `<button class="tile" data-from="pool" data-i="${i}">${esc(p.t)}</button>`).join("");
      check.disabled = s.pool.length > 0;
      if (autoCheckOn() && !s.pool.length && !check.dataset.done) setTimeout(() => !check.dataset.done && check.click(), 250);
      $view.querySelectorAll(".tile").forEach(b => b.onclick = () => {
        if (check.dataset.done) return;
        const i = Number(b.dataset.i);
        if (b.dataset.from === "pool") s.picked.push(...s.pool.splice(i, 1));
        else s.pool.push(...s.picked.splice(i, 1));
        drawTiles();
      });
    };
    drawTiles();
  }
  $view.querySelectorAll(".choice").forEach(c => c.onclick = () => {
    if (check.dataset.done) return;
    $view.querySelectorAll(".choice").forEach(x => x.classList.remove("selected"));
    c.classList.add("selected"); s.selected = c.dataset.id; check.disabled = false;
    if (autoCheckOn()) check.click();
  });

  check.onclick = () => {
    if (check.dataset.done) { s.queue.shift(); return swapView(() => renderQuestion(s)); }
    const ok = answerCheck();
    check.dataset.done = "1";
    s.answered++;
    if (it) grade(it.id, ok);
    if (ok) { s.correct++; s.combo++; s.bestCombo = Math.max(s.bestCombo, s.combo); }
    else { s.combo = 0; if (!q.retry) { s.retries++; s.queue.push({ ...q, retry: true }); } } // retry once at the end
    $view.querySelectorAll(".choice").forEach(c => {
      if (c.dataset.id === rightId) c.classList.add("right");
      else if (c.dataset.id === s.selected) c.classList.add("wrong");
    });
    document.getElementById("fb").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}">
      ${Mascot.react(ok, s.combo)}
      <div style="font-weight:400">${ok ? "" : "Correct answer: "}${esc(answerText)}</div>
      ${ok && s.accentNote ? `<div class="accent-note">Watch the accents: <b>${esc(it.jp)}</b></div>` : ""}</div>`;
    s.accentNote = false;
    if (q.kind !== "listen" && sayAfter) setTimeout(() => speak(sayAfter), 350);
    check.textContent = "Continue";
    autoAdvance(check, ok, () => check.click());
    check.disabled = false;
    check.focus();
  };
}

function finishSession(s) {
  const accuracy = Math.round((s.correct / Math.max(1, s.answered)) * 100);
  const xp = (s.review ? 5 : 10) + Math.round(accuracy / 10);
  if (s.lesson) state.completed[s.lesson.id] = true;
  addXp(xp);
  $view.innerHTML = `<div class="lesson done">
    <h2>${s.review ? "Review complete!" : "Lesson complete!"}</h2>
    <p class="muted">${esc(s.title)}</p>
    ${Mascot.finish(accuracy)}
    <div class="done-stats">
      <div class="card"><b>+${xp}</b>XP</div>
      <div class="card"><b>${accuracy}%</b>accuracy</div>
      <div class="card"><b>🔥 ${s.bestCombo}</b>best combo</div>
    </div>
    ${s.lesson ? `<button class="chip-btn" id="noteAfter">📝 Write a note about this lesson</button>` : ""}
    <div class="spacer"></div>
    <button class="btn" id="cont">Continue</button>
  </div>`;
  document.getElementById("cont").onclick = () => setTab(s.review ? "review" : "home");
  const na = document.getElementById("noteAfter");
  if (na) na.onclick = () => openNote(s.lesson.id, s.lesson.title);
  Mascot.bindTap($view);
}

// ---------- Boot ----------
// Other scripts (e.g. speak.js) can register extra tabs in VIEWS before boot.
const VIEWS = { review: renderReview, profile: renderProfile }; // home: journey.js · chart: conjugate.js
window.addEventListener("DOMContentLoaded", () => { save(); setTab("home"); setTimeout(moveTabInk, 50); });
