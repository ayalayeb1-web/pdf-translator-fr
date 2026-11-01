"use strict";
// The Speak tab as a speaking gym: daily mission, shadowing drills, ear training,
// a speaking review deck, and the role-plays from speak.js.

state.sayDeck = state.sayDeck || {};
state.missions = state.missions || {};
const SAY_INTERVALS = [0, 1, 3, 7, 14, 30];
const phraseObj = ([jp, romaji, en]) => ({ id: "say:" + jp, jp, romaji, en });
const allPhrases = () => PHRASE_PACKS.flatMap(p => p.phrases.map(phraseObj));
const sayDue = () => allPhrases().filter(p => state.sayDeck[p.id] && state.sayDeck[p.id].due <= Date.now());

// Text-to-speech with an end callback (and a safety timeout if the browser never fires one).
function say(text, rate = 0.9, onend) {
  TTS.speak(text, { rate, onend });
}
const waveHtml = () => `<div class="wave" id="wave" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--k:${i}"></i>`).join("")}</div>`;
const setWave = mode => { const w = document.getElementById("wave"); if (w) w.className = "wave " + (mode || ""); };

// ---------- hub ----------
function renderSpeakHub() {
  const due = sayDue().length;
  const mission = state.missions[today()];
  const micNote = Recognition ? "Your microphone works here: I'll listen and score you." : (IN_CLAUDE ? "No microphone in the online version, so say everything out loud, then rate yourself or type what you said." : "Use Chrome or Edge to let me hear you.");
  $view.innerHTML = `
    <h2>Speaking gym</h2>
    ${Mascot.bubbleHtml({ jp: "¡Lo importante es hablar en voz alta!", en: "Saying it out loud is what matters most! " + micNote }, "happy", 64)}
    <button class="mission-card ${mission?.done ? "done" : ""}" id="missionBtn">
      <span class="mc-eyebrow">🎯 Daily speaking mission · ${currentLevel().id}</span>
      <b>${mission?.task ? esc(mission.task) : "Today's speaking challenge"}</b>
      <span class="mc-cta">${mission?.done ? "✓ Done today — practice again" : "Start →"}</span>
    </button>
    <div class="gym-grid stagger">
      <button class="gym-card" id="shadowAll"><span class="gc-icon">🎧</span><b>Shadowing</b><small>Listen, speak along, then solo</small></button>
      <button class="gym-card" id="earBtn"><span class="gc-icon">👂</span><b>Ear training</b><small>Hear tricky sound pairs</small></button>
      <button class="gym-card" id="reviewSay" ${due ? "" : "disabled"}><span class="gc-icon">🔁</span><b>Speaking review</b><small>${due ? `${due} phrases due` : "Nothing due yet"}</small></button>
      <button class="gym-card" id="toRoleplays"><span class="gc-icon">🎭</span><b>Role-plays</b><small>${SCENARIOS.length} real situations</small></button>
    </div>
    <h3 class="gym-h">Phrase packs <small class="muted">tap one to shadow it</small></h3>
    <div class="packs stagger">${PHRASE_PACKS.map(p => {
      const learned = p.phrases.filter(ph => state.sayDeck["say:" + ph[0]]).length;
      return `<button class="pack" data-pack="${p.id}"><span class="pk-icon">${p.icon}</span><b>${esc(p.title)}</b><small>${p.level} · ${learned}/${p.phrases.length}</small>
        <span class="pk-bar"><span style="width:${learned / p.phrases.length * 100}%"></span></span></button>`;
    }).join("")}</div>
    <h3 class="gym-h" id="rpHead">Role-plays</h3>
    <div class="stagger">${SCENARIOS.map(sc => `
      <div class="rp-row">
        <button class="card scenario" data-id="${sc.id}">
          <span class="emoji">${sc.emoji}</span>
          <span style="flex:1;min-width:0"><b>${esc(sc.title)}</b><span class="pill">${sc.level}</span>
            <small>${esc(sc.goal)}</small>${(state.speak || {})[sc.id] ? `<small>Best: ${state.speak[sc.id]}%</small>` : ""}</span>
        </button>
        ${aiAvailable ? `<button class="chip-btn rp-ai" data-ai="${sc.id}">🤖 Chat with AI</button>` : ""}
      </div>`).join("")}</div>`;
  Mascot.bindTap($view);
  document.getElementById("missionBtn").onclick = startMission;
  document.getElementById("shadowAll").onclick = () => shadowSession(pickShadow(allPhrases()), "Shadowing");
  document.getElementById("earBtn").onclick = earTraining;
  document.getElementById("reviewSay").onclick = () => shadowSession(shuffle(sayDue()).slice(0, 8), "Speaking review");
  document.getElementById("toRoleplays").onclick = () => document.getElementById("rpHead").scrollIntoView({ behavior: "smooth" });
  $view.querySelectorAll("[data-pack]").forEach(b => b.onclick = () => {
    const pack = PHRASE_PACKS.find(p => p.id === b.dataset.pack);
    shadowSession(pickShadow(pack.phrases.map(phraseObj)), `${pack.icon} ${pack.title}`);
  });
  $view.querySelectorAll("[data-id]").forEach(b => b.onclick = () => runScenario(SCENARIOS.find(s => s.id === b.dataset.id)));
  $view.querySelectorAll("[data-ai]").forEach(b => b.onclick = () => runAiChat(SCENARIOS.find(s => s.id === b.dataset.ai)));
  if (aiAvailable === null) checkAi().then(ok => { if (ok && currentTab === "speak" && !document.body.classList.contains("in-lesson")) renderSpeakHub(); });
}
VIEWS.speak = renderSpeakHub;

// Due phrases first, then new ones, then the rest — 6 per session.
function pickShadow(list) {
  const due = list.filter(p => state.sayDeck[p.id]?.due <= Date.now());
  const fresh = list.filter(p => !state.sayDeck[p.id]);
  const rest = list.filter(p => !due.includes(p) && !fresh.includes(p));
  return [...shuffle(due), ...fresh, ...shuffle(rest)].slice(0, 6);
}

// ---------- shadowing ----------
function shadowSession(phrases, title) {
  if (!phrases.length) return toast("Nothing to practice here yet");
  document.body.classList.add("in-lesson");
  let idx = 0, phase = "listen", nailed = 0, lastScore = null;
  const rate = r => {
    const p = phrases[idx], card = state.sayDeck[p.id] || { box: 0 };
    card.box = r === "again" ? 0 : r === "almost" ? Math.max(1, card.box) : Math.min(SAY_INTERVALS.length - 1, card.box + 1);
    card.due = Date.now() + SAY_INTERVALS[card.box] * DAY;
    state.sayDeck[p.id] = card; save();
    if (r === "nailed") { nailed++; Mascot.sfx("right"); } else if (r === "again") Mascot.sfx("tap");
    idx++; phase = "listen"; lastScore = null;
    if (idx >= phrases.length) return finish();
    swapView(draw);
  };
  const finish = () => {
    const pct = Math.round(100 * nailed / phrases.length);
    addXp(8 + phrases.length * 2);
    swapView(() => {
      $view.innerHTML = `<div class="lesson done"><h2>Shadowing done!</h2>${Mascot.finish(Math.max(pct, 60))}
        <div class="done-stats"><div class="card"><b>${phrases.length}</b>phrases</div><div class="card"><b>${nailed}</b>nailed</div><div class="card"><b>+${8 + phrases.length * 2}</b>XP</div></div>
        <p class="muted">Phrases you found hard come back sooner in Speaking review.</p>
        <div class="spacer"></div><button class="btn" id="cont">Continue</button></div>`;
      Mascot.bindTap($view);
      document.getElementById("cont").onclick = () => setTab("speak");
    });
  };
  const draw = () => {
    const p = phrases[idx];
    const steps = [["listen", "① Listen"], ["shadow", "② Speak along"], ["solo", "③ Solo"]];
    $view.innerHTML = `<div class="lesson">
      <div class="lesson-top"><button class="icon-btn" id="quit" aria-label="Quit">✕</button>
        <div class="progress"><div style="width:${idx / phrases.length * 100}%"></div></div><span class="muted">${idx + 1}/${phrases.length}</span></div>
      <div class="muted" style="margin-top:10px;font-weight:800">${esc(title)}</div>
      <div class="phase-chips">${steps.map(([k, l]) => `<span class="${k === phase ? "on" : steps.findIndex(s => s[0] === phase) > steps.findIndex(s => s[0] === k) ? "past" : ""}">${l}</span>`).join("")}</div>
      <div class="say-card">
        <div class="say-jp">${esc(p.jp)}</div>
        <div class="say-en" id="ro" ${state.showRomaji === false ? "hidden" : ""}>${esc(p.en)}</div>
        <button class="chip-btn" id="roT">${state.showRomaji === false ? "Show" : "Hide"} English</button>
      </div>
      ${waveHtml()}
      <div id="phaseBox" class="phase-box"></div>
      <div class="spacer"></div>
    </div>`;
    document.getElementById("quit").onclick = () => { TTS.cancel(); setTab("speak"); };
    document.getElementById("roT").onclick = () => { state.showRomaji = state.showRomaji === false; save(); draw(); };
    const box = document.getElementById("phaseBox");
    if (phase === "listen") {
      box.innerHTML = `<p>Listen carefully. Notice the rhythm and where the stress falls.</p>
        <div class="tr-actions"><button class="btn secondary" id="again">▶ Normal</button><button class="btn secondary" id="slow">🐢 Slow</button></div>
        <button class="btn" id="nx" style="margin-top:10px">Next: speak along →</button>`;
      const play = r => { setWave("speaking"); say(p.jp, r, () => setWave()); };
      document.getElementById("again").onclick = () => play(0.95);
      document.getElementById("slow").onclick = () => play(0.6);
      document.getElementById("nx").onclick = () => { phase = "shadow"; draw(); };
      play(0.9);
    } else if (phase === "shadow") {
      box.innerHTML = `<p><b>Speak at the same time as the voice</b>, like a karaoke duet. Copy the melody, not just the words.</p>
        <button class="btn" id="go">🎤 Start speaking along</button>
        <button class="btn secondary" id="nx" style="margin-top:10px">Next: say it solo →</button>`;
      document.getElementById("go").onclick = () => {
        setWave("duet"); Mascot.sfx("tap");
        setTimeout(() => say(p.jp, 0.8, () => setWave()), 500);
      };
      document.getElementById("nx").onclick = () => { phase = "solo"; draw(); };
    } else if (phase === "solo") {
      box.innerHTML = `<p><b>Now say it on your own.</b> ${Recognition ? "I'm listening!" : "Say it out loud — really!"}</p>
        <button class="btn" id="go">I'm ready</button>`;
      document.getElementById("go").onclick = () => soloRound(p, box, score => { lastScore = score; showRate(box, p); });
    }
  };
  const showRate = (box, p) => {
    box.innerHTML = `${lastScore !== null ? `<div class="feedback ${lastScore.pct >= 70 ? "ok" : "bad"}">I heard: <b>${esc(lastScore.heard)}</b> · ${lastScore.pct}%</div>` : ""}
      <button class="chip-btn" id="cmp">▶ Compare with the native audio</button>
      <p style="margin:12px 0 6px;font-weight:800">How did it go?</p>
      <div class="rate-row">
        <button class="rate again" data-r="again">🔁<b>Again</b><small>soon</small></button>
        <button class="rate almost" data-r="almost">🙂<b>Almost</b><small>tomorrow</small></button>
        <button class="rate nailed ${lastScore?.pct >= 80 ? "suggest" : ""}" data-r="nailed">🎉<b>Nailed it</b><small>later</small></button>
      </div>`;
    box.querySelector("#cmp").onclick = () => { setWave("speaking"); say(p.jp, 0.9, () => setWave()); };
    box.querySelectorAll("[data-r]").forEach(b => b.onclick = () => rate(b.dataset.r));
  };
  swapView(draw);
}

// Countdown, then a timed "speak now" bar (and speech recognition where available).
function soloRound(p, box, done) {
  const secs = Math.min(9, 1.4 + p.jp.length * 0.22);
  let n = 3;
  box.innerHTML = `<div class="countdown" id="cd">3</div>`;
  const cd = box.querySelector("#cd");
  const tick = () => {
    n--;
    if (n > 0) { cd.textContent = n; cd.classList.remove("pulse"); void cd.offsetWidth; cd.classList.add("pulse"); Mascot.sfx("tap"); setTimeout(tick, 650); return; }
    box.innerHTML = `<div class="speak-now">Speak now!</div><div class="timebar"><span style="animation-duration:${secs}s"></span></div>`;
    setWave("listening");
    let result = null, finished = false;
    const end = () => {
      if (finished) return; finished = true; setWave();
      if (result) {
        const s = scoreAnswer(result, [[p.jp, p.romaji, p.en]]);
        done({ heard: s.heard, pct: Math.round(s.score * 100) });
      } else done(null);
    };
    if (Recognition) {
      try { listen(alts => { result = alts; end(); }, () => setTimeout(end, 200)); } catch (_) { /* mic unavailable */ }
    }
    setTimeout(end, secs * 1000 + (Recognition ? 1500 : 0));
  };
  cd.classList.add("pulse");
  setTimeout(tick, 650);
}

// ---------- ear training ----------
function earTraining() {
  document.body.classList.add("in-lesson");
  const qs = shuffle(MINIMAL_PAIRS).slice(0, 10).map(pr => ({ pr, pickA: Math.random() < .5 }));
  let k = 0, right = 0, combo = 0;
  const next = () => {
    if (k >= qs.length) return end();
    const { pr, pickA } = qs[k];
    const target = pickA ? pr[0] : pr[3];
    swapView(() => {
      $view.innerHTML = `<div class="lesson">
        <div class="lesson-top"><button class="icon-btn" id="quit" aria-label="Quit">✕</button>
          <div class="progress"><div style="width:${k / qs.length * 100}%"></div></div><span class="muted">${k + 1}/${qs.length}</span></div>
        <div class="prompt">👂 Which word do you hear?</div>
        ${waveHtml()}
        <div style="text-align:center"><button class="speak big-play" id="play" aria-label="Play">▶</button>
          <div><button class="chip-btn" id="slowP">🐢 Slow</button></div></div>
        <div class="pair-row stagger">
          ${[[pr[0], pr[1], pr[2]], [pr[3], pr[4], pr[5]]].map(([w, r, m]) => `<button class="pair" data-w="${esc(w)}"><b>${esc(w)}</b><span>${esc(r)}</span><small>${esc(m)}</small></button>`).join("")}
        </div>
        <div id="efb"></div><div class="spacer"></div></div>`;
      document.getElementById("quit").onclick = () => setTab("speak");
      const play = r => { setWave("speaking"); say(target, r, () => setWave()); };
      document.getElementById("play").onclick = () => play(0.85);
      document.getElementById("slowP").onclick = () => play(0.55);
      setTimeout(() => play(0.85), 350);
      let answered = false;
      $view.querySelectorAll(".pair").forEach(b => b.onclick = () => {
        if (answered) { say(b.dataset.w, 0.8); return; }
        answered = true;
        const ok = b.dataset.w === target;
        if (ok) { right++; combo++; } else combo = 0;
        $view.querySelectorAll(".pair").forEach(x => x.classList.add(x.dataset.w === target ? "right" : "dim"));
        if (!ok) b.classList.add("wrong");
        document.getElementById("efb").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}">${Mascot.react(ok, combo)}
          <div style="font-weight:400">The difference: <b>${esc(pr[6])}</b>. Tap both words to compare them.</div></div>
          <button class="btn" id="nx" style="margin-top:10px">Continue</button>`;
        document.getElementById("nx").onclick = () => { k++; next(); };
        autoAdvance(document.getElementById("nx"), ok, () => document.getElementById("nx")?.click());
      });
    });
  };
  const end = () => {
    const pct = Math.round(100 * right / qs.length);
    addXp(5 + right);
    swapView(() => {
      $view.innerHTML = `<div class="lesson done"><h2>Ear training done!</h2>${Mascot.finish(pct)}
        <div class="done-stats"><div class="card"><b>${right}/${qs.length}</b>heard right</div><div class="card"><b>+${5 + right}</b>XP</div></div>
        <p class="muted">The rolled rr, the Spanish &quot;th&quot;, stress and ñ all change the meaning, so hearing them is the first step to saying them.</p>
        <div class="spacer"></div><button class="btn" id="again">Again</button><button class="btn secondary" id="cont" style="margin-top:10px">Back to the gym</button></div>`;
      Mascot.bindTap($view);
      document.getElementById("again").onclick = earTraining;
      document.getElementById("cont").onclick = () => setTab("speak");
    });
  };
  next();
}

// ---------- daily mission ----------
async function getMission() {
  const key = today(), lvl = currentLevel();
  const m = state.missions[key];
  if (m?.level === lvl.id && m.task) return m;
  let mission;
  try {
    const r = await aiJson(`Create one short speaking task for a learner of Castilian Spanish (Spain) at CEFR ${lvl.id} (${lvl.jlpt}). Date: ${key}.
It should be practical and personal (talk about your life, react to a situation, ask for something, give an opinion at higher levels), answerable in 1-4 sentences.
Reply with only JSON: {"task": "the task in English", "task_jp": "the task in simple Spanish", "hints": [{"jp": "useful Spanish word or pattern", "romaji": "", "en": ""}], "example": {"jp": "an example answer in peninsular Spanish at this level", "romaji": "", "en": ""}}
Give 3-4 hints.`, { cache: { gcTime: 86400000 } });
    mission = { task: String(r.task || ""), task_jp: String(r.task_jp || ""), hints: Array.isArray(r.hints) ? r.hints : [], example: r.example || null, ai: true };
    if (!mission.task || !mission.example?.jp) throw new Error("incomplete");
  } catch (_) {
    let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [task, jp, romaji, en] = STATIC_MISSIONS[h % STATIC_MISSIONS.length];
    mission = { task, task_jp: "", hints: [], example: { jp, romaji, en }, ai: false };
  }
  state.missions[key] = { ...mission, level: lvl.id, done: m?.done || false };
  save();
  return state.missions[key];
}

async function startMission() {
  document.body.classList.add("in-lesson");
  $view.innerHTML = `<div class="lesson done"><h2>Preparing your mission…</h2>${Mascot.bubbleHtml({ jp: "¡Un momentito!", en: "Thinking of a good challenge for you…" }, "wink", 100, "finish-kitsu")}<div class="scan"><span></span></div></div>`;
  const m = await getMission();
  swapView(() => {
    $view.innerHTML = `<div class="lesson">
      <div class="lesson-top"><button class="icon-btn" id="quit" aria-label="Quit">✕</button><div style="flex:1"><b>🎯 Daily mission</b> <span class="muted">${currentLevel().id}</span></div></div>
      <div class="mission-task"><b>${esc(m.task)}</b>${m.task_jp ? `<div class="muted">${esc(m.task_jp)}</div>` : ""}</div>
      ${m.hints?.length ? `<details class="card"><summary><b>💡 Useful words</b></summary><div class="vocab-chips">${m.hints.map(hh => `<button class="vchip" data-say="${esc(hh.jp || "")}"><b>${esc(hh.jp || "")}</b><small>${esc(hh.en || "")}</small></button>`).join("")}</div></details>` : ""}
      <details class="card"><summary><b>👀 Show an example answer</b></summary><p class="lc-jp" style="font-size:1.1rem">${esc(m.example.jp)}</p><p class="muted">${esc(m.example.romaji || "")}<br>${esc(m.example.en || "")}</p>
        <button class="chip-btn" data-say="${esc(m.example.jp)}">🔊 Listen</button></details>
      ${Mascot.bubbleHtml({ jp: "¡Primero, dilo en voz alta!", en: Recognition ? "Tap the mic and answer out loud!" : "Say your answer OUT LOUD first. Then type what you said, so I can correct it." }, "normal", 54)}
      <div class="answer-bar mission-input">
        <textarea id="mAns" class="note-text" placeholder="Escribe lo que has dicho…" lang="es"></textarea>
        ${Recognition ? `<button class="mic" id="mMic" aria-label="Speak">🎤</button>` : ""}
      </div>
      <button class="btn" id="mGo" disabled>Check my answer</button>
      <div id="mFb"></div>
    </div>`;
    document.getElementById("quit").onclick = () => setTab("speak");
    $view.querySelectorAll("[data-say]").forEach(b => b.onclick = () => say(b.dataset.say, 0.85));
    const ta = document.getElementById("mAns"), go = document.getElementById("mGo");
    ta.oninput = () => (go.disabled = !ta.value.trim());
    const mic = document.getElementById("mMic");
    if (mic) mic.onclick = () => { mic.classList.add("listening"); listen(alts => { ta.value = (ta.value ? ta.value + " " : "") + alts[0]; go.disabled = false; }, () => mic.classList.remove("listening")); };
    go.onclick = () => checkMission(m, ta.value.trim());
  });
}

async function checkMission(m, answer) {
  const fbBox = document.getElementById("mFb"), go = document.getElementById("mGo");
  go.disabled = true; go.textContent = "Kitsu is listening…";
  let fb = null;
  try {
    fb = await aiJson(`You are a kind, precise Castilian Spanish (Spain) speaking coach. A learner at CEFR ${currentLevel().id} answered this speaking task out loud and typed what they said (it may lack accents or contain speech-recognition errors).
Task: ${m.task}
Learner's answer: ${answer}
Reply with only JSON: {"score": 0-100 (task completed + correctness + naturalness for this level), "good": "one sentence on what was good", "fix": "1-2 sentences on the most important mistakes, in simple English (empty if none)", "corrected": {"jp": "their answer, minimally corrected", "romaji": ""}, "natural": {"jp": "how a native speaker from Spain would say it, at the learner's level", "romaji": "", "en": "English"}}`, { modelTier: "quick", cache: false });
  } catch (_) { /* no AI: show the example instead */ }
  const m2 = state.missions[today()]; if (m2) { m2.done = true; save(); }
  addXp(20); Mascot.sfx("finish");
  const natural = fb?.natural?.jp ? fb.natural : m.example;
  const score = fb ? Math.max(0, Math.min(100, Number(fb.score) || 0)) : null;
  if (score !== null && score >= 70) Mascot.confetti();
  fbBox.innerHTML = `<div class="card mission-fb">
    ${score !== null ? `<div class="score-ring"><b>${score}</b><small>/100</small></div>` : ""}
    ${fb ? `<p>✅ ${esc(fb.good || "")}</p>${fb.fix ? `<p>🛠️ ${esc(fb.fix)}</p>` : ""}
      ${fb.corrected?.jp ? `<div class="fb-line"><small class="muted">Your answer, corrected</small><b>${esc(fb.corrected.jp)}</b></div>` : ""}` : `<p class="muted">AI feedback needs the online version. Compare your answer with this example:</p>`}
    <div class="fb-line natural"><small class="muted">How a native speaker would say it</small><b>${esc(natural.jp)}</b><span class="muted">${esc(natural.romaji || "")}</span><span>${esc(natural.en || "")}</span></div>
    <button class="btn" id="shadowNat">🎧 Shadow this until it's smooth</button>
  </div>`;
  go.textContent = "Mission complete ✓";
  fbBox.scrollIntoView({ behavior: "smooth", block: "start" });
  document.getElementById("shadowNat").onclick = () => {
    const sentences = natural.jp.split(/(?<=[.!?])\s+/).map(t => t.trim()).filter(Boolean);
    shadowSession(sentences.map(jp => ({ id: "say:" + jp, jp, romaji: sentences.length === 1 ? natural.romaji || "" : "", en: sentences.length === 1 ? natural.en || "" : "" })), "🎯 Mission phrase");
  };
}
