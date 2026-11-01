"use strict";

// ---------- Persistence ----------
const STORE_KEY = "nihongo-path-v1";
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
let jaVoice = null;
function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  jaVoice = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith("ja")) || null;
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!("speechSynthesis" in window)) return toast("Audio isn't supported in this browser");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP"; u.rate = 0.8;
  if (jaVoice) u.voice = jaVoice;
  speechSynthesis.speak(u);
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
  if (lesson.type === "reading") return `You are writing one reading lesson of a Japanese course for English speakers.
Level: CEFR ${level.id} (about JLPT ${level.jlpt}, ${level.name}). Text type: ${lesson.point}.

Reply with only one JSON object, in exactly this shape:
{
 "tokens": [{"t": "surface text", "r": "hiragana reading if it contains kanji, else empty", "en": "short English meaning or grammar role; empty for punctuation"}],
 "translation": "natural English translation of the whole text",
 "questions": [{"q": "comprehension question in English", "options": ["4", "short", "English", "options"], "answer": "the correct option"}]
}
Rules:
- The text is 5-8 sentences, natural and correct, at this level, with kanji a learner at this level reads.
- Split the text into word-sized tokens (a word with its okurigana; particles and punctuation are their own tokens). Joined in order the tokens give the full text.
- 4 comprehension questions; exactly one option is correct.`;
  return `You are writing one lesson of a Japanese course for English speakers.
Level: CEFR ${level.id} (about JLPT ${level.jlpt}, ${level.name}).
Lesson: "${lesson.title}". Grammar point / skill: ${lesson.point}.

Reply with only one JSON object, in exactly this shape:
{
 "explain": "3-5 plain-English sentences: what it means, how to form it (which verb/adjective/noun forms it attaches to), and any nuance or common confusion.",
 "examples": [{"jp": "Japanese sentence", "romaji": "romaji", "en": "English"}],
 "vocab": [{"jp": "word as normally written", "kana": "reading in hiragana", "romaji": "romaji", "en": "English"}],
 "exercises": [
  {"fill": "Japanese sentence with exactly one ＿ where the target form goes", "options": ["4", "short", "answer", "choices"], "answer": "the one correct option", "en": "English translation of the full sentence"},
  {"order": ["3 to 8", "tiles", "in the", "correct order"], "en": "English translation"}
 ]
}
Rules:
- 4 examples, 5 vocab words that appear in the examples, 5 fill exercises and 2 order exercises.
- Natural, correct Japanese at this level, using the kanji a learner at this level would read.
- In fill exercises exactly one option is correct; the other three are plausible mistakes (other forms or similar grammar). The ＿ is the full-width character U+FF3F.
- Order tiles are natural chunks (word + particle may be separate tiles); joined in order they form the full sentence without punctuation.
- Romaji: Hepburn, lowercase, long vowels as ou / uu.`;
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
  const examples = (raw.examples || []).map(e => [str(e.jp), str(e.romaji), str(e.en)]).filter(e => e[0] && e[2]);
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
    id: `vocab:${str(v.jp)}`, jp: str(v.jp), kana: str(v.kana) !== str(v.jp) ? str(v.kana) : undefined, romaji: str(v.romaji), en: str(v.en),
  })).filter(v => v.jp && v.romaji && v.en);
  if (!str(raw.explain) || examples.length < 2 || exercises.length < 3) throw new Error("incomplete");
  return { explain: str(raw.explain), examples, exercises, items };
}

async function generateLesson(lesson) {
  document.body.classList.add("in-lesson");
  $view.innerHTML = `<div class="lesson done">
    <div class="emoji">✍️</div>
    <h2>Writing your lesson…</h2>
    ${Mascot.bubbleHtml({ jp: "ちょっと待ってね！", en: "Give me a moment — writing your lesson!" }, "wink", 90, "finish-kitsu")}
    <p class="muted">${esc(lesson.point)}</p>
    <p>Kitsu is preparing ${lesson.type === "reading" ? "a reading passage and questions" : "explanations, examples and exercises"}. This takes up to a minute, and only happens once.</p>
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
function setTab(tab) {
  currentTab = tab;
  document.body.classList.remove("in-lesson");
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  VIEWS[tab]();
  $view.scrollTop = 0;
}
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button"); if (b) setTab(b.dataset.tab);
});

function nodeFace(lesson, i) {
  if (state.completed[lesson.id]) return "✓";
  if (lesson.ai && !lesson.generated) return "✨";
  if (lesson.type === "kana" || lesson.type === "kanji") return lesson.items[0].jp;
  if (lesson.type === "grammar") return "文";
  return "語";
}

function renderHome() {
  const got = state.daily[today()] || 0;
  const due = dueItems().length;
  const level = currentLevel();
  const all = lessonsOf(level);
  const done = all.filter(l => state.completed[l.id]).length;
  const wotd = wordOfTheDay();
  const nothingDone = !Object.keys(state.completed).length;
  let html = `
    ${Mascot.homeCard()}
    ${!state.placement && nothingDone ? `<button class="btn" id="placeBtn" style="margin-bottom:14px">🎯 Find my level (2 min)</button>` : ""}
    <div class="levels" role="tablist">${LEVELS.map(l => `
      <button class="level-chip ${l.id === level.id ? "active" : ""}" data-level="${l.id}" role="tab" aria-selected="${l.id === level.id}">
        <b>${l.id}</b><small>${l.jlpt}</small></button>`).join("")}
    </div>
    <div class="card level-card">
      <div><b>${level.id} · ${esc(level.name)}</b> <span class="muted">≈ JLPT ${level.jlpt}</span></div>
      <div class="muted">${esc(level.desc)}</div>
      <div class="goal-bar" style="margin-top:10px"><div style="width:${all.length ? done / all.length * 100 : 0}%"></div></div>
      <div class="muted" style="margin-top:6px;font-size:.85rem">${done}/${all.length} lessons · Daily goal ${Math.min(got, DAILY_GOAL)}/${DAILY_GOAL} XP</div>
      ${due ? `<p style="margin:10px 0 0">🔁 <b>${due}</b> card${due > 1 ? "s" : ""} ready to review.</p>` : ""}
      ${level.ai ? `<p class="muted" style="margin:10px 0 0;font-size:.85rem">✨ Lessons at this level are written by AI the first time you open them, then saved on this device. Uses your claude.ai account.</p>` : ""}
      <div class="level-links">
        ${videoLink(`learn Japanese JLPT ${level.jlpt} lesson`, `${level.jlpt} video lessons`)}
        ${videoLink(`Japanese listening practice JLPT ${level.jlpt}`, "Listening practice")}
        ${videoLink(`learn Japanese with anime ${level.jlpt}`, "Learn with anime")}
        ${state.placement || !nothingDone ? `<button class="chip-btn" id="placeBtn">🎯 Retake level test</button>` : ""}
      </div>
    </div>
    ${wotd ? `<div class="card wotd">
      <div class="w-meta"><div class="muted" style="font-size:.75rem;font-weight:800;letter-spacing:.06em">WORD OF THE DAY</div>
        <div class="w-jp">${esc(wotd.jp)}</div>
        <div class="muted">${wotd.kana ? esc(wotd.kana) + " · " : ""}${esc(wotd.romaji)} — ${esc(wotd.en)}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="speak small" id="wotdSay" aria-label="Play">🔊</button>
        <button class="chip-btn" id="wotdAdd">${state.srs[wotd.id] ? "✓ In review" : "+ Review"}</button>
      </div></div>` : ""}`;
  level.units.forEach((unit, u) => {
    const udone = unit.lessons.filter(l => state.completed[l.id]).length;
    html += `
      <div class="section-head">
        <div class="badge" style="background:${unit.color}">${unit.icon}</div>
        <div><b>${esc(unit.title)}</b><div class="muted">${udone}/${unit.lessons.length} lessons</div></div>
      </div>
      <div class="path">`;
    unit.lessons.forEach((l, i) => {
      const unlocked = isUnlocked(unit, i);
      html += `
        <button class="node ${unlocked ? "" : "locked"}" data-u="${u}" data-l="${i}" ${unlocked ? "" : "disabled"}>
          <div class="circle" style="background:${unit.color}">${esc(nodeFace(l, i))}</div>
          <div class="label">${esc(l.title)}</div>
        </button>`;
    });
    html += `</div>`;
  });
  $view.innerHTML = html;
  Mascot.bindTap($view);
  document.getElementById("placeBtn")?.addEventListener("click", startPlacement);
  if (wotd) {
    document.getElementById("wotdSay").onclick = () => speak(wotd.kana || wotd.jp);
    document.getElementById("wotdAdd").onclick = () => {
      if (!state.srs[wotd.id]) { state.srs[wotd.id] = { box: 0, due: Date.now(), seen: 0, right: 0 }; save(); toast("Added to your review deck"); }
      renderHome();
    };
  }
  $view.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { state.level = b.dataset.level; save(); renderHome(); });
  $view.querySelectorAll(".node:not(.locked)").forEach(n =>
    n.addEventListener("click", () => startLesson(level.units[n.dataset.u].lessons[n.dataset.l])));
}

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

let chartScript = "Hiragana", chartMode = "hear";
function renderChart() {
  const kanaUnits = LEVELS[0].units.filter(u => u.lessons[0]?.type === "kana");
  const kanjiList = Object.values(ALL_ITEMS).filter(i => i.type === "kanji");
  const isKanji = chartScript === "Kanji";
  const unit = kanaUnits.find(u => u.title === chartScript) || kanaUnits[0];
  const flat = isKanji ? kanjiList : unit.lessons.flatMap(l => l.items.map(it => ALL_ITEMS[it.id] || it));
  let cells = "";
  if (isKanji) cells = kanjiList.map(it => `<button class="cell ${mastered(it.id) ? "mastered" : ""}" data-id="${esc(it.id)}"><span class="k">${esc(it.jp)}</span><span class="r">${esc(it.en.split(/[,(]/)[0].trim())}</span></button>`).join("");
  else unit.lessons.forEach(l => {
    const items = l.items;
    // Pad Y and W rows so columns line up with the vowels.
    const layout = items.length === 3 && items[0].romaji === "ya" ? [items[0], null, items[1], null, items[2]]
      : items.length === 3 ? [items[0], null, null, items[1], items[2]] : items;
    layout.forEach(it => {
      cells += it
        ? `<button class="cell ${mastered(it.id) ? "mastered" : ""}" data-id="${esc(it.id)}"><span class="k">${esc(it.jp)}</span><span class="r">${esc(it.romaji)}</span></button>`
        : `<div class="cell empty"></div>`;
    });
  });
  $view.innerHTML = `
    <h2>Write & read</h2>
    <div class="seg">
      ${[...kanaUnits.map(u => u.title), "Kanji"].map(t => `<button class="btn ${t === chartScript ? "" : "secondary"}" data-script="${t}">${t}</button>`).join("")}
    </div>
    <div class="seg mode">
      <button class="chip-btn ${chartMode === "hear" ? "active" : ""}" data-mode="hear">🔊 Tap to hear</button>
      <button class="chip-btn ${chartMode === "trace" ? "active" : ""}" data-mode="trace">✍️ Tap to trace</button>
      <button class="chip-btn" id="drill">🎲 Random drill</button>
    </div>
    <p class="muted">${isKanji ? `${kanjiList.length} kanji in the course.` : ""} Green border = mastered.</p>
    <div class="chart">${cells}</div>`;
  $view.querySelectorAll("[data-script]").forEach(b => b.onclick = () => { chartScript = b.dataset.script; renderChart(); });
  $view.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { chartMode = b.dataset.mode; renderChart(); });
  document.getElementById("drill").onclick = () => openTracer(shuffle(flat).slice(0, 10), 0);
  $view.querySelectorAll(".cell[data-id]").forEach(c => c.onclick = () => {
    const it = ALL_ITEMS[c.dataset.id];
    if (chartMode === "trace") openTracer(flat, flat.findIndex(x => x.id === it.id));
    else speak(it.kana ? it.kana.split("・")[0] : it.jp);
  });
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
  const kanjiKnown = Object.keys(state.srs).filter(id => id.startsWith("kanji:") && mastered(id)).length;
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
      <div class="row-list"><span>🈶 Kanji mastered</span><b>${kanjiKnown}</b></div>
      <div class="row-list"><span>🎯 Review accuracy</span><b>${acc}%</b></div>
    </div>
    <div class="card">
      <b>Settings</b>
      <label class="toggle-row" for="optVoice"><span>🦊 Kitsu speaks out loud</span><input type="checkbox" id="optVoice" ${state.voice !== false ? "checked" : ""}></label>
      <label class="toggle-row" for="optSfx"><span>🔔 Sound effects</span><input type="checkbox" id="optSfx" ${state.sfx !== false ? "checked" : ""}></label>
      <label class="toggle-row" for="optFuri"><span>あ Furigana in readings</span><input type="checkbox" id="optFuri" ${state.furigana !== false ? "checked" : ""}></label>
    </div>
    <button class="btn secondary" id="reset">Reset progress</button>`;
  document.getElementById("optVoice").onchange = e => { state.voice = e.target.checked; save(); };
  document.getElementById("optSfx").onchange = e => { state.sfx = e.target.checked; save(); if (e.target.checked) Mascot.sfx("right"); };
  document.getElementById("optFuri").onchange = e => { state.furigana = e.target.checked; save(); };
  document.getElementById("reset").onclick = () => {
    askConfirm("Erase all progress? This can't be undone.", "Erase").then(ok => {
      if (ok) { state = { xp: 0, streak: 0, lastDay: null, completed: {}, srs: {}, daily: {}, aiLessons: state.aiLessons, notes: state.notes }; save(); renderProfile(); }
    });
  };
}

// ---------- Lessons & quiz engine ----------
function startLesson(lesson) {
  if (lesson.ai && !lesson.generated) return generateLesson(lesson);
  startSession({ title: lesson.title, items: lesson.items || [], lesson, intro: !state.completed[lesson.id] || lesson.type !== "kana" });
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
  if (intro.length) renderIntro(s); else renderQuestion(s);
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
      if (ok) { window.speechSynthesis?.cancel(); setTab(currentTab); }
    });
  };
}

function itemCardHtml(it) {
  const kind = { kana: "character", kanji: "kanji" }[it.type] || "word";
  const sub = it.type === "kanji"
    ? `<div class="reading">${esc(it.kana)}</div><span class="romaji">${esc(it.romaji)}</span><br><span class="muted">${esc(it.en)}</span>`
    : `${it.kana ? `<div class="reading">${esc(it.kana)}</div>` : ""}<span class="romaji">${esc(it.romaji)}</span>${it.type !== "kana" ? `<br><span class="muted">${esc(it.en)}</span>` : ""}`;
  return `<div class="prompt">New ${kind}</div>
    <div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>
    <div class="card-actions">
      <button class="speak" data-say="${esc(it.kana ? it.kana.split("・")[0] : it.jp)}" aria-label="Play audio">🔊</button>
      ${it.type === "kana" || it.type === "kanji" ? `<button class="speak" data-trace="${esc(it.jp)}" aria-label="Practice writing">✍️</button>` : ""}
    </div>
    <div class="intro-meta">${sub}</div>
    ${it.type === "kanji" || it.type === "kana" ? `<div style="text-align:center">${videoLink(`${it.jp} ${it.type === "kanji" ? "kanji" : "kana"} stroke order`, "Stroke order video")}</div>` : ""}`;
}

function readingCardHtml(lesson) {
  const furi = state.furigana !== false;
  return `<div class="prompt">${esc(lesson.title)}</div>
    <div class="reading-tools">
      <button class="chip-btn" id="readAll">🔊 Listen</button>
      <button class="chip-btn" id="toggleFuri">${furi ? "Hide" : "Show"} furigana</button>
      <button class="chip-btn" id="toggleTr">Translation</button>
    </div>
    <p class="muted" style="margin:6px 0">Tap any word to see what it means.</p>
    <div class="passage">${lesson.tokens.map((t, i) => t.en || t.r
      ? `<button class="tok" data-i="${i}">${furi && t.r ? `<ruby>${esc(t.t)}<rt>${esc(t.r)}</rt></ruby>` : esc(t.t)}</button>`
      : `<span class="punct">${esc(t.t)}</span>`).join("")}</div>
    <div class="gloss" id="gloss" hidden></div>
    <p class="translation" id="tr" hidden>${esc(lesson.translation || "")}</p>`;
}

function grammarCardHtml(lesson) {
  return `<div class="prompt">${esc(lesson.title)}</div>
    <div class="point">${esc(lesson.point)}</div>
    <div>${videoLink(`Japanese grammar ${lesson.point.split(/[ /]/)[0]} explained`, "Video lessons on this grammar")}</div>
    <p class="explain">${esc(lesson.explain)}</p>
    <div class="examples">${lesson.examples.map(([jp, romaji, en]) => `
      <button class="example" data-say="${esc(jp)}">
        <span class="ex-jp">🔊 ${esc(jp)}</span><span class="ex-ro">${esc(romaji)}</span><span class="ex-en">${esc(en)}</span>
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
  $view.querySelectorAll("[data-trace]").forEach(b => b.onclick = () => openTracer([ALL_ITEMS[card.item.id] || card.item], 0));
  if (card.reading) {
    const lesson = card.reading;
    document.getElementById("readAll").onclick = () => speak(lesson.tokens.map(t => t.t).join(""));
    document.getElementById("toggleFuri").onclick = () => { state.furigana = state.furigana === false; save(); renderIntro(s); };
    document.getElementById("toggleTr").onclick = () => { const tr = document.getElementById("tr"); tr.hidden = !tr.hidden; };
    $view.querySelectorAll(".tok").forEach(b => b.onclick = () => {
      const t = lesson.tokens[b.dataset.i];
      $view.querySelectorAll(".tok.on").forEach(x => x.classList.remove("on")); b.classList.add("on");
      const g = document.getElementById("gloss");
      g.hidden = false;
      g.innerHTML = `<button class="speak small" aria-label="Play">🔊</button><div><b>${esc(t.t)}</b>${t.r ? ` <span class="muted">${esc(t.r)}</span>` : ""}<div>${esc(t.en)}</div></div>`;
      g.querySelector("button").onclick = () => speak(t.r || t.t);
      speak(t.r || t.t);
    });
  }
  if (card.item) speak(card.item.kana ? card.item.kana.split("・")[0] : card.item.jp);
  document.getElementById("next").onclick = () => {
    s.introIdx++;
    if (s.introIdx < s.intro.length) renderIntro(s); else renderQuestion(s);
  };
}

// Accept any of the readings listed as "a / b".
const romajiMatches = (typed, romaji) => romaji.split("/").some(r => normalize(r) === normalize(typed));

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
      <div class="passage small" id="reread" hidden>${s.lesson.tokens.map(t => esc(t.t)).join("")}</div>
      <div class="choices one-col">${shuffle(ex.options).map(o => `<button class="choice" data-id="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    rightId = ex.answer;
    answerCheck = () => s.selected === ex.answer;
    answerText = ex.answer;
  } else if (q.kind === "fill") {
    const ex = q.ex;
    const opts = shuffle(ex.options);
    body = `<div class="prompt">Fill in the blank</div>
      <div class="sentence">${esc(ex.fill).replace("＿", '<span class="blank">＿＿</span>')}</div>
      ${ex.en ? `<p class="muted">${esc(ex.en)}</p>` : ""}
      <div class="choices">${opts.map(o => `<button class="choice" data-id="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
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
      <div class="tiles" id="pool"></div>`;
    answerCheck = () => s.picked.map(p => p.t).join("") === ex.order.join("");
    answerText = ex.order.join("");
    sayAfter = answerText;
  } else if (q.kind === "type") {
    const isKanji = it.type === "kanji";
    body = `<div class="prompt">${isKanji ? "Type a reading in romaji" : "Type the romaji"}</div>
      <div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>
      <input class="type-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${isKanji ? "e.g. yama" : "e.g. neko"}">`;
    answerCheck = () => romajiMatches(document.getElementById("ans").value, it.romaji);
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
      <div class="choices">${opts.map(o => `<button class="choice" data-id="${esc(o.id)}">${esc(label(o))}</button>`).join("")}</div>`;
    rightId = it.id;
    answerCheck = () => s.selected === it.id;
  }
  if (it) {
    answerText = it.type === "kana" ? `${it.jp} = ${it.romaji}`
      : `${it.jp}${it.kana ? ` (${it.kana})` : ""} · ${it.romaji} = ${it.en}`;
    sayAfter = it.kana ? it.kana.split("・")[0] : it.jp;
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
    input.oninput = () => (check.disabled = !input.value.trim());
    input.onkeydown = e => { if (e.key === "Enter" && !check.disabled) check.click(); };
  }
  if (q.kind === "order") {
    const drawTiles = () => {
      const line = document.getElementById("line"), pool = document.getElementById("pool");
      line.innerHTML = s.picked.map((p, i) => `<button class="tile" data-from="line" data-i="${i}">${esc(p.t)}</button>`).join("");
      pool.innerHTML = s.pool.map((p, i) => `<button class="tile" data-from="pool" data-i="${i}">${esc(p.t)}</button>`).join("");
      check.disabled = s.pool.length > 0;
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
  });

  check.onclick = () => {
    if (check.dataset.done) { s.queue.shift(); return renderQuestion(s); }
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
      <div style="font-weight:400">${ok ? "" : "Correct answer: "}${esc(answerText)}</div></div>`;
    if (q.kind !== "listen" && sayAfter) setTimeout(() => speak(sayAfter), 350);
    check.textContent = "Continue";
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
const VIEWS = { home: renderHome, review: renderReview, chart: renderChart, profile: renderProfile };
window.addEventListener("DOMContentLoaded", () => { save(); setTab("home"); });
