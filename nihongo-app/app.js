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

function isUnlocked(section, idx) {
  return idx === 0 || !!state.completed[section.lessons[idx - 1].id];
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

function renderHome() {
  const got = state.daily[today()] || 0;
  const due = dueItems().length;
  let html = `
    <div class="card">
      <b>Daily goal</b> <span class="muted">· ${Math.min(got, DAILY_GOAL)}/${DAILY_GOAL} XP</span>
      <div class="goal-bar" style="margin-top:8px"><div style="width:${Math.min(100, got / DAILY_GOAL * 100)}%"></div></div>
      ${due ? `<p style="margin:12px 0 0">🔁 <b>${due}</b> card${due > 1 ? "s" : ""} ready to review.</p>` : ""}
    </div>`;
  COURSE.forEach((section, s) => {
    const done = section.lessons.filter(l => state.completed[l.id]).length;
    html += `
      <div class="section-head">
        <div class="badge" style="background:${section.color}">${section.icon}</div>
        <div><b>${esc(section.name)}</b><div class="muted">${done}/${section.lessons.length} lessons</div></div>
      </div>
      <div class="path">`;
    section.lessons.forEach((l, i) => {
      const unlocked = isUnlocked(section, i);
      const complete = state.completed[l.id];
      const face = complete ? "✓" : (l.type === "kana" ? l.items[0].jp : (i + 1));
      html += `
        <button class="node ${unlocked ? "" : "locked"}" data-s="${s}" data-l="${i}" ${unlocked ? "" : "disabled"}>
          <div class="circle" style="background:${section.color}">${esc(face)}</div>
          <div class="label">${esc(l.title)}</div>
        </button>`;
    });
    html += `</div>`;
  });
  $view.innerHTML = html;
  $view.querySelectorAll(".node:not(.locked)").forEach(n =>
    n.addEventListener("click", () => startLesson(COURSE[n.dataset.s].lessons[n.dataset.l])));
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

let chartScript = "Hiragana";
function renderChart() {
  const section = COURSE.find(s => s.name === chartScript);
  let cells = "";
  section.lessons.forEach(l => {
    const items = l.items;
    // Pad Y and W rows so columns line up with the vowels.
    const layout = items.length === 3 && items[0].romaji === "ya" ? [items[0], null, items[1], null, items[2]]
      : items.length === 3 ? [items[0], null, null, items[1], items[2]] : items;
    layout.forEach(it => {
      cells += it
        ? `<button class="cell ${mastered(it.id) ? "mastered" : ""}" data-jp="${esc(it.jp)}"><span class="k">${esc(it.jp)}</span><span class="r">${esc(it.romaji)}</span></button>`
        : `<div class="cell empty"></div>`;
    });
  });
  $view.innerHTML = `
    <h2>Kana chart</h2>
    <div class="seg">
      ${COURSE.filter(s => s.lessons[0].type === "kana").map(s =>
        `<button class="btn ${s.name === chartScript ? "" : "secondary"}" data-script="${s.name}">${s.name}</button>`).join("")}
    </div>
    <p class="muted">Tap a character to hear it. Green border = mastered.</p>
    <div class="chart">${cells}</div>`;
  $view.querySelectorAll("[data-script]").forEach(b => b.onclick = () => { chartScript = b.dataset.script; renderChart(); });
  $view.querySelectorAll(".cell[data-jp]").forEach(c => c.onclick = () => speak(c.dataset.jp));
}

function renderProfile() {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { label: d.toLocaleDateString(undefined, { weekday: "short" }), xp: state.daily[key] || 0 };
  });
  const max = Math.max(DAILY_GOAL, ...days.map(d => d.xp));
  const cards = Object.values(state.srs);
  const acc = cards.reduce((a, c) => a + c.seen, 0) ? Math.round(100 * cards.reduce((a, c) => a + c.right, 0) / cards.reduce((a, c) => a + c.seen, 0)) : 0;
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
      ${COURSE.map(s => `<div class="row-list"><span>${s.icon} ${s.name}</span><b>${s.lessons.flatMap(l => l.items).filter(i => mastered(i.id)).length}/${s.lessons.flatMap(l => l.items).length} mastered</b></div>`).join("")}
      <div class="row-list"><span>🎯 Accuracy</span><b>${acc}%</b></div>
    </div>
    <button class="btn secondary" id="reset">Reset progress</button>`;
  document.getElementById("reset").onclick = () => {
    if (confirm("Erase all progress?")) { state = { xp: 0, streak: 0, lastDay: null, completed: {}, srs: {}, daily: {} }; save(); renderProfile(); }
  };
}

// ---------- Lessons & quiz engine ----------
function startLesson(lesson) {
  startSession({ title: lesson.title, items: lesson.items, lesson, intro: !state.completed[lesson.id] });
}

function makeQuestions(items, perItem) {
  const kinds = ["meaning", "reverse", "listen", "type"];
  const qs = [];
  items.forEach(it => {
    sample(kinds, perItem).forEach(kind => qs.push({ item: it, kind }));
  });
  return shuffle(qs);
}

function distractors(item, n) {
  const sameType = Object.values(ALL_ITEMS).filter(i => i.type === item.type && i.id !== item.id
    && i.id.split(":")[0] === item.id.split(":")[0] && i.romaji !== item.romaji);
  return sample(sameType, n);
}

function startSession(opts) {
  document.body.classList.add("in-lesson");
  const items = opts.items.map(i => ALL_ITEMS[i.id] || i);
  const s = {
    ...opts, items,
    step: 0, introIdx: opts.intro ? 0 : -1,
    queue: makeQuestions(items, opts.review ? 1 : 2),
    answered: 0, correct: 0, retries: 0,
  };
  s.total = s.queue.length;
  if (s.introIdx === 0) renderIntro(s); else renderQuestion(s);
}

function lessonHeader(s, pct) {
  return `<div class="lesson-top">
    <button class="icon-btn" id="quit" aria-label="Quit">✕</button>
    <div class="progress"><div style="width:${pct}%"></div></div>
  </div>`;
}
function bindQuit() {
  document.getElementById("quit").onclick = () => {
    if (confirm("Quit this lesson? Progress in it will be lost.")) { speechSynthesis?.cancel(); setTab(currentTab); }
  };
}

function renderIntro(s) {
  const it = s.items[s.introIdx];
  $view.innerHTML = `<div class="lesson">
    ${lessonHeader(s, (s.introIdx / s.items.length) * 30)}
    <div class="prompt">New ${it.type === "kana" ? "character" : "word"}</div>
    <div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>
    <button class="speak" id="say" aria-label="Play audio">🔊</button>
    <p class="intro-meta"><span class="romaji">${esc(it.romaji)}</span>${it.type === "vocab" ? `<br><span class="muted">${esc(it.en)}</span>` : ""}</p>
    <div class="spacer"></div>
    <button class="btn" id="next">${s.introIdx === s.items.length - 1 ? "Start practice" : "Next"}</button>
  </div>`;
  bindQuit();
  speak(it.jp);
  document.getElementById("say").onclick = () => speak(it.jp);
  document.getElementById("next").onclick = () => {
    s.introIdx++;
    if (s.introIdx < s.items.length) renderIntro(s); else renderQuestion(s);
  };
}

function renderQuestion(s) {
  if (!s.queue.length) return finishSession(s);
  const q = s.queue[0];
  const it = q.item;
  const isKana = it.type === "kana";
  const base = s.intro ? 30 : 0;
  const pct = base + (s.answered / (s.total + s.retries)) * (100 - base);
  let body = "", answerCheck;

  if (q.kind === "type") {
    body = `<div class="prompt">Type the romaji</div>
      <div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>
      <input class="type-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. ${isKana ? "ka" : "neko"}">`;
    answerCheck = () => normalize(document.getElementById("ans").value) === normalize(it.romaji);
  } else {
    const opts = shuffle([it, ...distractors(it, 3)]);
    let prompt, show, label;
    if (q.kind === "meaning") {
      prompt = isKana ? "What sound is this?" : "What does this mean?";
      show = `<div class="big ${it.jp.length > 1 ? "word" : ""}">${esc(it.jp)}</div>`;
      label = o => isKana ? o.romaji : o.en;
    } else if (q.kind === "reverse") {
      prompt = isKana ? `Which one is “${esc(it.romaji)}”?` : `How do you say “${esc(it.en)}”?`;
      show = "";
      label = o => o.jp;
    } else {
      prompt = "What do you hear?";
      show = `<button class="speak" id="say" aria-label="Play audio" style="margin-top:20px">🔊</button>`;
      label = o => o.jp;
    }
    body = `<div class="prompt">${prompt}</div>${show}
      <div class="choices">${opts.map(o => `<button class="choice" data-id="${esc(o.id)}">${esc(label(o))}</button>`).join("")}</div>`;
    answerCheck = () => s.selected === it.id;
  }

  $view.innerHTML = `<div class="lesson">
    ${lessonHeader(s, pct)}
    ${body}
    <div class="spacer"></div>
    <div id="fb"></div>
    <button class="btn" id="check" disabled>Check</button>
  </div>`;
  bindQuit();
  const check = document.getElementById("check");
  s.selected = null;

  if (q.kind === "listen") { speak(it.jp); document.getElementById("say").onclick = () => speak(it.jp); }
  if (q.kind === "type") {
    const input = document.getElementById("ans");
    input.focus();
    input.oninput = () => (check.disabled = !input.value.trim());
    input.onkeydown = e => { if (e.key === "Enter" && !check.disabled) check.click(); };
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
    grade(it.id, ok);
    if (ok) s.correct++;
    else if (!q.retry) { s.retries++; s.queue.push({ ...q, retry: true }); } // retry once at the end
    $view.querySelectorAll(".choice").forEach(c => {
      if (c.dataset.id === it.id) c.classList.add("right");
      else if (c.dataset.id === s.selected) c.classList.add("wrong");
    });
    const answer = isKana ? `${it.jp} = ${it.romaji}` : `${it.jp} (${it.romaji}) = ${it.en}`;
    document.getElementById("fb").innerHTML = ok
      ? `<div class="feedback ok">✓ Nice! <span style="font-weight:400">${esc(answer)}</span></div>`
      : `<div class="feedback bad">✗ Correct answer: <span style="font-weight:400">${esc(answer)}</span></div>`;
    if (q.kind !== "listen") speak(it.jp);
    check.textContent = "Continue";
    check.focus();
  };
}

function finishSession(s) {
  const accuracy = Math.round((s.correct / Math.max(1, s.answered)) * 100);
  const xp = (s.review ? 5 : 10) + Math.round(accuracy / 10);
  if (s.lesson) state.completed[s.lesson.id] = true;
  addXp(xp);
  $view.innerHTML = `<div class="lesson done">
    <div class="emoji">${accuracy >= 90 ? "🌸" : accuracy >= 60 ? "🎉" : "💪"}</div>
    <h2>${s.review ? "Review complete!" : "Lesson complete!"}</h2>
    <p class="muted">${esc(s.title)}</p>
    <div class="done-stats">
      <div class="card"><b>+${xp}</b>XP</div>
      <div class="card"><b>${accuracy}%</b>accuracy</div>
      <div class="card"><b>🔥 ${currentStreak()}</b>streak</div>
    </div>
    <div class="spacer"></div>
    <button class="btn" id="cont">Continue</button>
  </div>`;
  document.getElementById("cont").onclick = () => setTab(s.review ? "review" : "home");
}

// ---------- Boot ----------
// Other scripts (e.g. speak.js) can register extra tabs in VIEWS before boot.
const VIEWS = { home: renderHome, review: renderReview, chart: renderChart, profile: renderProfile };
window.addEventListener("DOMContentLoaded", () => { save(); setTab("home"); });
