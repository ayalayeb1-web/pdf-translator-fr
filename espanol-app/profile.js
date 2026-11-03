"use strict";
// The "Me" tab: profile header, stats, week chart, levels, badges, voice card and settings.
// Shared by both apps; language details come from VOICE_LANG / VOICE_CFG-style globals.

const ME_TEXT = {
  ja: {
    gentle: { jp: "ふふ、これからはやさしく教えますね。", en: "Hehe, from now on I'll teach you gently." },
    cheerful: { jp: "やっほー！元気にいこうね！", en: "Yay! Let's go with energy!" },
    test: "こんにちは！キツネのキツです。聞こえますか？",
  },
  es: {
    gentle: { jp: "Muy bien. A partir de ahora, te enseñaré con calma.", en: "Very well. From now on, I'll teach you calmly." },
    cheerful: { jp: "¡Vamos allá! ¡Con mucha energía!", en: "Let's go! With lots of energy!" },
    test: "¡Hola! Soy Lía, la lince. ¿Me oyes bien?",
  },
};

function renderMe() {
  const L = VOICE_LANG, T = ME_TEXT[L.code] || ME_TEXT.es, isEs = L.code === "es";
  const lvl = currentLevel(), all = lessonsOf(lvl), done = all.filter(x => state.completed[x.id]).length, pct = all.length ? done / all.length : 0;
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * DAY), key = d.toISOString().slice(0, 10);
    return { label: d.toLocaleDateString(undefined, { weekday: "narrow" }), xp: state.daily[key] || 0, today: i === 6 };
  });
  const weekTotal = days.reduce((a, d) => a + d.xp, 0), max = Math.max(DAILY_GOAL * 1.3, ...days.map(d => d.xp));
  const cards = Object.values(state.srs), seen = cards.reduce((a, c) => a + c.seen, 0);
  const acc = seen ? Math.round(100 * cards.reduce((a, c) => a + c.right, 0) / seen) : 0;
  const words = Object.keys(state.srs).filter(id => id.startsWith("vocab:") && mastered(id)).length;
  const special = isEs ? Object.values(state.conj || {}).filter(c => c.box >= 3).length : Object.keys(state.srs).filter(id => id.startsWith("kanji:") && mastered(id)).length;
  const badges = typeof BADGES !== "undefined" ? BADGES.filter(b => state.badges?.[b.id]).length : 0;
  const v = TTS.voices().find(x => x.name === TTS.currentFor(false)), accn = TTS.accent();
  const prof = VOICE_PROFILES.find(p => p.id === (state.voiceProfile || "f-soft")) || VOICE_PROFILES[0];
  const mode = VOICE_MODES.find(m => m.id === (state.voiceMode || "natural")) || VOICE_MODES[1];
  const ring = 2 * Math.PI * 30;
  const sw = (id, on, icon, color, label, desc) => `<label class="set-row" for="${id}">
      <span class="set-ic" style="--c:${color}">${icon}</span><span class="set-txt"><b>${label}</b><small>${desc}</small></span>
      <input type="checkbox" class="switch" id="${id}" ${on ? "checked" : ""}></label>`;

  $view.innerHTML = `
    <section class="me-hero region-${lvl.id}">
      <div class="me-avatar" id="meAvatar">${Mascot.svg("happy", 76)}</div>
      <div class="me-id">
        <small>Your journey</small>
        <b>${esc(REGIONS?.[lvl.id]?.name || lvl.name)}</b>
        <div class="me-chips"><span>${lvl.id} · ${esc(lvl.jlpt)}</span><span>🔥 ${currentStreak()} day${currentStreak() === 1 ? "" : "s"}</span></div>
      </div>
      <div class="me-ring" title="${done}/${all.length} lessons in ${lvl.id}">
        <svg viewBox="0 0 72 72" width="72" height="72"><circle cx="36" cy="36" r="30" class="mr-bg"/><circle cx="36" cy="36" r="30" class="mr-fg" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - pct)}"/></svg>
        <b>${Math.round(pct * 100)}%</b><small>${lvl.id}</small>
      </div>
    </section>

    <div class="stat-tiles stagger">
      <div class="tile" style="--c:#ff6b4a"><span>🔥</span><b>${currentStreak()}</b><small>day streak</small></div>
      <div class="tile" style="--c:#f2b134"><span>⭐</span><b>${state.xp}</b><small>total XP</small></div>
      <div class="tile" style="--c:#4f8ef7"><span>📚</span><b>${words}</b><small>words mastered</small></div>
      <div class="tile" style="--c:#a26bf2"><span>${isEs ? "🔥" : "🈴"}</span><b>${special}</b><small>${isEs ? "verb forms" : "kanji"} mastered</small></div>
      <div class="tile" style="--c:#22b07d"><span>🎯</span><b>${acc}%</b><small>review accuracy</small></div>
      <div class="tile" style="--c:#ef4e86"><span>🏅</span><b>${badges}</b><small>badges</small></div>
    </div>

    <div class="card week-card">
      <div class="wc-head"><b>This week</b><span><b>${weekTotal}</b> XP</span></div>
      <div class="wc-chart">
        <div class="wc-goal" style="bottom:${(DAILY_GOAL / max) * 100}%"><span>goal ${DAILY_GOAL}</span></div>
        ${days.map(d => `<div class="wc-col ${d.today ? "today" : ""}"><div class="wc-bar ${d.xp >= DAILY_GOAL ? "hit" : ""}" style="height:${Math.max(3, (d.xp / max) * 100)}%"><i>${d.xp || ""}</i></div><small>${d.label}</small></div>`).join("")}
      </div>
    </div>

    <div class="card levels-card">
      <b>Levels</b>
      ${LEVELS.map(l => {
        const la = lessonsOf(l), ld = la.filter(x => state.completed[x.id]).length;
        return `<div class="lv-row region-${l.id} ${l.id === lvl.id ? "current" : ""}"><span class="lv-badge">${l.id}</span>
          <span class="lv-txt"><b>${esc(REGIONS?.[l.id]?.name || l.name)}</b><small>${esc(l.jlpt)} · ${ld}/${la.length}</small></span>
          <span class="lv-bar"><span style="width:${la.length ? (ld / la.length) * 100 : 0}%"></span></span></div>`;
      }).join("")}
    </div>

    ${typeof badgesCardHtml === "function" ? badgesCardHtml() : ""}

    <div class="card voice-card2">
      <div class="vc-top">
        <div class="vc-disc ${v && TTS.gender(v) === "m" ? "m" : "f"}">${v ? (TTS.gender(v) === "m" ? "♂" : "♀") : "🔇"}</div>
        <div class="vc-info"><small>Lesson voice</small><b>${v ? esc(voiceShortName(v.name)) : "No voice in this browser"}</b>
          <span>${accn.flag} ${esc(accn.name)}</span></div>
        <button class="vc-play" id="testVoice" aria-label="Play the lesson voice">▶</button>
      </div>
      <div class="vc-wave" id="vcWave" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--k:${i}"></i>`).join("")}</div>
      <div class="vc-tags"><span>${prof.icon} ${esc(prof.name)}</span><span>${mode.icon} ${esc(mode.name)}</span>${v && TTS.isNatural(v) ? "<span class='nat'>✨ Neural</span>" : ""}</div>
      <div class="vc-actions">
        <button id="openStudio"><span>🎚️</span>Voice settings</button>
        <button id="openLab"><span>🧪</span>Voice lab</button>
        <button id="testKitsu"><span>${L.icon}</span>${esc(L.mascot)}</button>
      </div>
      <div id="voiceDiag"></div>
    </div>

    <div class="set-group">
      <div class="sg-title">${esc(L.mascot)}'s personality</div>
      <div class="segmented" role="radiogroup">${[["cheerful", "☀️", "Cheerful"], ["gentle", "🌙", "Gentle & polite"]].map(([k, ic, lb]) =>
        `<button role="radio" aria-checked="${(state.kitsuStyle || "cheerful") === k}" class="${(state.kitsuStyle || "cheerful") === k ? "on" : ""}" data-kitsu="${k}">${ic} ${lb}</button>`).join("")}</div>
    </div>

    <div class="set-group">
      <div class="sg-title">Preferences</div>
      ${sw("optVoice", state.voice !== false, L.icon, "#ff8a5c", `${esc(L.mascot)} speaks out loud`, "Greetings and reactions with voice")}
      ${sw("optAuto", state.autoNext !== false, "⚡", "#f2b134", "Auto-check &amp; next", "Answers check themselves and move on")}
      ${sw("optSfx", state.sfx !== false, "🔔", "#4f8ef7", "Sound effects", "Dings, combos and celebrations")}
      ${L.code === "ja" ? sw("optFuri", state.furigana !== false, "あ", "#a26bf2", "Furigana in readings", "Small kana above the kanji") : ""}
    </div>

    <div class="set-group">
      <button class="set-row link" id="openNotes"><span class="set-ic" style="--c:#22b07d">📝</span><span class="set-txt"><b>My notes</b><small>${Object.keys(state.notes || {}).length} notes</small></span><span class="chev">›</span></button>
      <button class="set-row link danger" id="reset"><span class="set-ic" style="--c:#ef4e66">↺</span><span class="set-txt"><b>Reset progress</b><small>Erase lessons, XP and reviews</small></span><span class="chev">›</span></button>
    </div>`;

  // wiring
  Mascot.bindTap?.($view);
  document.getElementById("meAvatar").onclick = () => { Mascot.voice(T.cheerful); Mascot.sfx("tap"); };
  document.getElementById("openNotes").onclick = () => setTab("notes");
  if (typeof bindBadges === "function") bindBadges($view);
  document.getElementById("openStudio").onclick = () => openVoiceStudio("lesson");
  document.getElementById("openLab").onclick = () => openVoiceLab();
  const wave = document.getElementById("vcWave");
  const playing = on => wave.classList.toggle("playing", on);
  document.getElementById("testVoice").onclick = () => {
    playing(true);
    TTS.speak(T.test, { onend: () => playing(false) });
    setTimeout(() => { const d = document.getElementById("voiceDiag"); if (d) voiceDiagnosis(d); }, 700);
  };
  document.getElementById("testKitsu").onclick = () => { playing(true); TTS.speak(MASCOT_SAMPLE, { character: true, onend: () => playing(false) }); };
  $view.querySelectorAll("[data-kitsu]").forEach(b => b.onclick = () => {
    state.kitsuStyle = b.dataset.kitsu; save();
    $view.querySelectorAll("[data-kitsu]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
    Mascot.voice(b.dataset.kitsu === "gentle" ? T.gentle : T.cheerful);
  });
  document.getElementById("optVoice").onchange = e => { state.voice = e.target.checked; save(); };
  document.getElementById("optAuto").onchange = e => { state.autoNext = e.target.checked; save(); };
  document.getElementById("optSfx").onchange = e => { state.sfx = e.target.checked; save(); if (e.target.checked) Mascot.sfx("right"); };
  document.getElementById("optFuri")?.addEventListener("change", e => { state.furigana = e.target.checked; save(); });
  document.getElementById("reset").onclick = () => askConfirm("Erase all progress? This can't be undone.", "Erase").then(ok => {
    if (ok) { state = { xp: 0, streak: 0, lastDay: null, completed: {}, srs: {}, daily: {}, aiLessons: state.aiLessons, notes: state.notes }; save(); renderMe(); }
  });
}
VIEWS.profile = renderMe;
