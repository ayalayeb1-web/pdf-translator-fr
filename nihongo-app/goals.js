"use strict";
// Daily plan (4 goals that check themselves off) and badges (achievements).
// Shared by both apps; the mascot's name comes from VOICE_CFG.

state.stats = state.stats || {};
state.badges = state.badges || {};
state.plan = state.plan || {};
const IS_SPANISH = typeof conjugate === "function";

function planToday() {
  const t = today();
  if (state.plan.date !== t) state.plan = { date: t, lesson: 0, review: 0, speak: 0, bonus: false };
  return state.plan;
}

// Called by lessons, reviews, speaking, videos and drills when they finish.
function logActivity(kind, info = {}) {
  const st = state.stats, plan = planToday(), h = new Date().getHours();
  if (kind === "lesson") { st.lessons = (st.lessons || 0) + 1; plan.lesson++; }
  if (kind === "drill") { st.drills = (st.drills || 0) + 1; plan.lesson++; }
  if (kind === "review") { st.reviews = (st.reviews || 0) + 1; plan.review++; }
  if (kind === "speak") { st.speak = (st.speak || 0) + 1; plan.speak++; }
  if (kind === "video") st.videos = (st.videos || 0) + 1;
  if (info.accuracy === 100 && (kind === "lesson" || kind === "drill")) st.perfects = (st.perfects || 0) + 1;
  if (info.bestCombo) st.bestCombo = Math.max(st.bestCombo || 0, info.bestCombo);
  if (h >= 22 || h < 4) st.nightOwl = true;
  if (h >= 4 && h < 8) st.earlyBird = true;
  save();
  if (planDone() && !plan.bonus) {
    plan.bonus = true; st.perfectDays = (st.perfectDays || 0) + 1;
    addXp(15);
    setTimeout(() => celebrate("🌟", "Perfect day!", "You finished today's whole plan. +15 XP"), 1400);
  }
  setTimeout(checkBadges, 2600);
}

function planItems() {
  const p = planToday(), due = dueItems().length, got = state.daily[today()] || 0;
  return [
    { id: "lesson", icon: "📘", label: IS_SPANISH ? "Lesson or verbs" : "1 lesson", done: p.lesson > 0, go: () => setTab("home") },
    { id: "review", icon: "🔁", label: due ? `Review (${due})` : "Review", done: p.review > 0 || (!due && p.lesson > 0), go: () => setTab("review") },
    { id: "speak", icon: "🗣️", label: "Speak", done: p.speak > 0, go: () => setTab("speak") },
    { id: "xp", icon: "⭐", label: `${Math.min(got, DAILY_GOAL)}/${DAILY_GOAL} XP`, done: got >= DAILY_GOAL, go: () => setTab("home") },
  ];
}
const planDone = () => planItems().every(i => i.done);

function dailyPlanHtml() {
  const items = planItems(), n = items.filter(i => i.done).length, c = 2 * Math.PI * 20;
  return `<div class="card plan-card ${n === items.length ? "complete" : ""}">
    <div class="plan-head">
      <div class="plan-ring"><svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="20" class="ring-bg2"/><circle cx="24" cy="24" r="20" class="ring-fg2" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - n / items.length)}"/></svg><b>${n}/${items.length}</b></div>
      <div><b class="plan-title">${n === items.length ? "Perfect day! 🌟" : "Today's plan"}</b><small class="muted">${n === items.length ? "See you tomorrow!" : "Tap a goal to do it"}</small></div>
    </div>
    <div class="plan-items">${items.map(i => `<button class="plan-item ${i.done ? "done" : ""}" data-plan="${i.id}">
      <span class="pi-check">${i.done ? "✓" : i.icon}</span><span>${esc(i.label)}</span></button>`).join("")}</div>
  </div>`;
}
function bindDailyPlan(root = document) {
  const items = planItems();
  root.querySelectorAll("[data-plan]").forEach(b => b.onclick = () => {
    const it = items.find(i => i.id === b.dataset.plan);
    if (it.id === "lesson" || it.id === "xp") document.querySelector(".mnode.current")?.scrollIntoView({ behavior: "smooth", block: "center" });
    else it.go();
  });
}

// ---------- badges ----------
function masteredCount(prefix) { return Object.keys(state.srs).filter(id => id.startsWith(prefix) && (state.srs[id].box || 0) >= 4).length; }
function levelCleared() { return LEVELS.some(l => lessonsOf(l).every(x => state.completed[x.id])); }
const BADGES = [
  { id: "first", icon: "🌱", name: "First steps", desc: "Finish your first lesson", val: () => state.stats.lessons || 0, goal: 1 },
  { id: "streak3", icon: "🔥", name: "On fire", desc: "Study 3 days in a row", val: () => currentStreak(), goal: 3 },
  { id: "streak7", icon: "🚀", name: "Unstoppable", desc: "Study 7 days in a row", val: () => currentStreak(), goal: 7 },
  { id: "streak30", icon: "👑", name: "Legend", desc: "Study 30 days in a row", val: () => currentStreak(), goal: 30 },
  { id: "words25", icon: "📗", name: "Word collector", desc: "Master 25 words", val: () => masteredCount("vocab:"), goal: 25 },
  { id: "words100", icon: "📚", name: "Walking dictionary", desc: "Master 100 words", val: () => masteredCount("vocab:"), goal: 100 },
  IS_SPANISH
    ? { id: "verbs50", icon: "🔥", name: "Verb tamer", desc: "Master 50 verb forms", val: () => Object.values(state.conj || {}).filter(c => c.box >= 3).length, goal: 50 }
    : { id: "kanji20", icon: "🈴", name: "Kanji hunter", desc: "Master 20 kanji", val: () => masteredCount("kanji:"), goal: 20 },
  { id: "perfect", icon: "🎯", name: "Perfectionist", desc: "Get 100% in a lesson", val: () => state.stats.perfects || 0, goal: 1 },
  { id: "combo10", icon: "⚡", name: "Combo master", desc: "Get 10 right answers in a row", val: () => state.stats.bestCombo || 0, goal: 10 },
  { id: "speak5", icon: "🗣️", name: "Chatterbox", desc: "Finish 5 speaking sessions", val: () => state.stats.speak || 0, goal: 5 },
  { id: "review10", icon: "🔁", name: "Memory keeper", desc: "Finish 10 reviews", val: () => state.stats.reviews || 0, goal: 10 },
  { id: "video", icon: "🎬", name: "Movie buff", desc: "Finish a video quiz in Watch & Learn", val: () => state.stats.videos || 0, goal: 1 },
  { id: "explorer", icon: "🧭", name: "Explorer", desc: "Visit 3 regions on the map", val: () => Object.keys(state.mapPos || {}).length, goal: 3 },
  { id: "owl", icon: "🦉", name: "Night owl", desc: "Study after 10 pm", val: () => (state.stats.nightOwl ? 1 : 0), goal: 1 },
  { id: "bird", icon: "🐦", name: "Early bird", desc: "Study before 8 am", val: () => (state.stats.earlyBird ? 1 : 0), goal: 1 },
  { id: "day1", icon: "🌟", name: "Perfect day", desc: "Finish a whole daily plan", val: () => state.stats.perfectDays || 0, goal: 1 },
  { id: "xp1000", icon: "💎", name: "XP collector", desc: "Earn 1000 XP", val: () => state.xp || 0, goal: 1000 },
  { id: "level", icon: "🏆", name: "Level cleared", desc: "Finish every lesson of a level", val: () => (levelCleared() ? 1 : 0), goal: 1 },
];
function checkBadges() {
  const fresh = BADGES.filter(b => !state.badges[b.id] && b.val() >= b.goal);
  if (!fresh.length) return;
  fresh.forEach(b => (state.badges[b.id] = today()));
  save();
  const b = fresh[0];
  celebrate(b.icon, `New badge: ${b.name}`, b.desc + (fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ""));
}
function celebrate(icon, title, text) {
  if (document.querySelector(".celebrate")) return;
  const w = document.createElement("div");
  w.className = "modal celebrate";
  w.innerHTML = `<div class="modal-box celebrate-box" role="dialog" aria-modal="true">
    <div class="cb-icon">${icon}</div><b class="cb-title">${esc(title)}</b><p>${esc(text)}</p>
    <button class="btn" id="cbOk">Yay!</button></div>`;
  document.body.append(w);
  Mascot.sfx("finish"); Mascot.confetti();
  w.querySelector("#cbOk").onclick = () => w.remove();
  w.onclick = e => { if (e.target === w) w.remove(); };
}
function weekXp(offset) {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += state.daily[new Date(Date.now() - (i + offset * 7) * DAY).toISOString().slice(0, 10)] || 0;
  return sum;
}
function badgesCardHtml() {
  const got = BADGES.filter(b => state.badges[b.id]).length, tw = weekXp(0), lw = weekXp(1);
  const diff = tw - lw;
  return `<div class="card badges-card">
    <div class="bc-head"><b>🏅 Badges</b><span class="muted">${got}/${BADGES.length}</span></div>
    <div class="week-vs"><div><small class="muted">This week</small><b>${tw} XP</b></div><div><small class="muted">Last week</small><b>${lw} XP</b></div>
      <div class="${diff >= 0 ? "up" : "down"}"><small class="muted">You vs you</small><b>${diff >= 0 ? "▲" : "▼"} ${Math.abs(diff)}</b></div></div>
    <div class="badge-grid">${BADGES.map(b => {
      const have = !!state.badges[b.id], v = Math.min(b.val(), b.goal);
      return `<button class="badge ${have ? "have" : ""}" data-badge="${b.id}" title="${esc(b.desc)}">
        <span class="bg-icon">${b.icon}</span><small>${esc(b.name)}</small>
        ${have ? "" : `<span class="bg-bar"><span style="width:${(v / b.goal) * 100}%"></span></span>`}</button>`;
    }).join("")}</div></div>`;
}
function bindBadges(root = document) {
  root.querySelectorAll("[data-badge]").forEach(el => el.onclick = () => {
    const b = BADGES.find(x => x.id === el.dataset.badge), have = state.badges[b.id];
    toast(have ? `${b.icon} ${b.name}: unlocked on ${have}` : `${b.icon} ${b.name}: ${b.desc} (${Math.min(b.val(), b.goal)}/${b.goal})`);
  });
}
