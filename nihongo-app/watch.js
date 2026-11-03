"use strict";
// Watch & Learn: upload your own video + Japanese subtitles. The AI places it at a
// level (A1–C2) and builds a 3-step lesson: watch with subtitles, watch without,
// then a quiz (comprehension, listening clips, translation graded by AI).
// Videos are stored in this browser (IndexedDB); nothing is uploaded anywhere.

state.videos = state.videos || {};

// ---------- storage (IndexedDB) ----------
const VDB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open("nihongo-videos", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("videos", { keyPath: "id" });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  }));
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction("videos", mode), st = t.objectStore("videos");
      const req = fn(st);
      t.oncomplete = () => res(req?.result); t.onerror = () => rej(t.error);
    });
  };
  return {
    put: rec => tx("readwrite", st => st.put(rec)),
    get: id => tx("readonly", st => st.get(id)),
    del: id => tx("readwrite", st => st.delete(id)),
  };
})();
const sessionVideos = {}; // fallback when IndexedDB is unavailable: id -> {blob, cues}

// ---------- subtitles ----------
function parseTime(t) {
  const m = t.trim().replace(",", ".").match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/);
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3])) : 0;
}
function parseSubtitles(text, name = "") {
  const cues = [];
  if (/\[Events\]/i.test(text) || /\.(ass|ssa)$/i.test(name)) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("Dialogue:")) continue;
      const parts = line.slice(9).split(",");
      const body = parts.slice(9).join(",").replace(/\{[^}]*\}/g, "").replace(/\\[Nn]/g, " ").trim();
      if (body) cues.push({ start: parseTime(parts[1]), end: parseTime(parts[2]), text: body });
    }
  } else if (/-->/.test(text)) {
    for (const block of text.replace(/\r/g, "").split(/\n\s*\n/)) {
      const lines = block.split("\n").filter(Boolean);
      const ti = lines.findIndex(l => l.includes("-->"));
      if (ti < 0) continue;
      const [a, b] = lines[ti].split("-->");
      const body = lines.slice(ti + 1).join(" ").replace(/<[^>]+>/g, "").replace(/\{[^}]*\}/g, "").trim();
      if (body) cues.push({ start: parseTime(a), end: parseTime(b.split(" ").filter(Boolean)[0] || b), text: body });
    }
  } else {
    // Plain transcript: one line per cue, no timing.
    text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(t => cues.push({ start: null, end: null, text: t }));
  }
  return cues.sort((x, y) => (x.start ?? 0) - (y.start ?? 0));
}
const hasJapanese = s => /[぀-ヿ一-鿿]/.test(s);

// Rough level from the subtitles alone (used before / without AI).
function estimateLevel(cues) {
  const all = cues.map(c => c.text).join("");
  const jp = all.match(/[぀-ヿ一-鿿]/g) || [];
  const kanji = all.match(/[一-鿿]/g) || [];
  const ratio = jp.length ? kanji.length / jp.length : 0;
  const avg = cues.length ? jp.length / cues.length : 0;
  let i = ratio < .1 ? 0 : ratio < .17 ? 1 : ratio < .23 ? 2 : ratio < .29 ? 3 : ratio < .35 ? 4 : 5;
  if (avg > 24) i++;
  return ["A1", "A2", "B1", "B2", "C1", "C2"][Math.min(5, i)];
}

// ---------- AI ----------
async function aiJson(prompt, opts = {}) {
  if (!(await checkAi()) || !sampleFn) throw { code: "no_ai" };
  return sampleFn.json(prompt, opts);
}
function analysisPrompt(title, cues) {
  const step = Math.max(1, Math.ceil(cues.length / 350));
  let lines = cues.map((c, i) => `[${i}] ${c.text}`).filter((_, i) => i % step === 0).join("\n");
  if (lines.length > 15000) lines = lines.slice(0, 15000);
  return `You are a Japanese teacher preparing a lesson from a video's Japanese subtitles for an English-speaking learner.
Video title: "${title}". Subtitle lines, each with its index:
${lines}

Reply with only one JSON object in exactly this shape:
{
 "level": "one of A1, A2, B1, B2, C1, C2 (CEFR; A1≈JLPT N5 … C1≈N1, C2 beyond N1) — how hard the Japanese is to understand",
 "why": "one sentence explaining the level (grammar, vocabulary, speed, slang)",
 "summary": "2-3 sentence English summary of what happens",
 "vocab": [{"jp": "word as written", "kana": "reading", "romaji": "romaji", "en": "meaning"}],
 "questions": [{"q": "comprehension question in English", "options": ["4", "English", "answer", "options"], "answer": "the correct option"}],
 "translate": [{"i": 12, "en": "natural English translation of line 12"}]
}
Rules: 12 useful vocab words that appear in the lines; 5 questions answerable from the lines (exactly one correct option each); 4 translate items choosing clear, meaningful lines of useful length (use the given indexes). Romaji: Hepburn, lowercase.`;
}
const aiErrorText = e => ({
  no_ai: "AI features need the online version of the app (opened in claude.ai).",
  not_granted: "The app needs your permission to use Claude. Reload the page to be asked again.",
  rate_limited: "You've hit a usage limit. Try again later.",
  sampling_disabled: "Claude isn't available on this account.",
}[e?.code] || "Kitsu couldn't finish that. Try again.");

// ---------- library view ----------
function renderWatch() {
  const vids = Object.entries(state.videos).sort((a, b) => b[1].created - a[1].created);
  const mine = currentLevel().id;
  $view.innerHTML = `
    <h2>Watch &amp; Learn</h2>
    ${Mascot.bubbleHtml({ jp: "好きな動画で勉強しよう！", en: "Learn with videos you love! Add a video and its Japanese subtitles — I'll find its level and make a lesson." }, "happy", 68)}
    <button class="btn" id="addVid">＋ Add a video</button>
    <div class="vid-list stagger">${vids.map(([id, v]) => {
      const steps = v.steps || {};
      const nDone = ["subs", "nosubs", "quiz"].filter(k => steps[k]).length;
      return `<button class="vid-card region-${v.level}" data-id="${id}">
        <div class="vid-thumb" style="${v.thumb ? `background-image:url(${v.thumb})` : ""}"><span class="vid-level">${v.level}${v.levelSource === "ai" ? "" : "?"}</span>${v.level === mine ? '<span class="vid-fit">Your level</span>' : ""}</div>
        <div class="vid-info"><b>${esc(v.title)}</b>
          <span class="muted">${v.cueCount} lines · ${nDone}/3 steps${v.levelSource === "ai" ? "" : " · level estimated"}</span>
          <div class="vid-steps">${["subs", "nosubs", "quiz"].map(k => `<i class="${steps[k] ? "on" : ""}"></i>`).join("")}</div></div>
      </button>`;
    }).join("")}</div>
    ${vids.length ? "" : `<div class="card watch-how stagger">
      <div><b>① Watch with subtitles</b><span class="muted">Tap any line to pause and see its translation.</span></div>
      <div><b>② Watch without subtitles</b><span class="muted">Train your ear. Reveal a line if you're stuck.</span></div>
      <div><b>③ Quiz</b><span class="muted">Questions about the video, listening clips, and translations graded by AI.</span></div>
    </div>`}
    <p class="muted" style="font-size:.8rem">Videos stay in this browser on this device. Use videos you have the right to watch. The AI reads the subtitles (it can't hear audio), so add a Japanese subtitle file (.srt, .vtt, .ass) or paste the Japanese lines.</p>`;
  Mascot.bindTap($view);
  document.getElementById("addVid").onclick = openUpload;
  $view.querySelectorAll(".vid-card").forEach(c => c.onclick = () => openVideo(c.dataset.id));
}
VIEWS.watch = renderWatch;

// ---------- upload ----------
function openUpload() {
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Add a video">
    <div class="sheet-grab"></div><div class="sheet-type">Watch &amp; Learn</div>
    <h2 class="sheet-title">Add a video</h2>
    <label class="field"><span>Video file</span><input type="file" id="upVideo" accept="video/*"></label>
    <label class="field"><span>Japanese subtitles (.srt, .vtt, .ass)</span><input type="file" id="upSubs" accept=".srt,.vtt,.ass,.ssa,.txt,text/plain"></label>
    <details class="field"><summary>No subtitle file? Paste the Japanese lines</summary>
      <textarea id="upPaste" class="note-text" style="min-height:120px" placeholder="こんにちは。&#10;今日はいい天気ですね。"></textarea></details>
    <label class="field"><span>Title</span><input type="text" id="upTitle" class="type-input" style="margin:0" placeholder="e.g. My favorite anime, episode 1"></label>
    <div id="upMsg" class="muted" style="min-height:22px"></div>
    <button class="btn" id="upGo">Add &amp; analyze</button>
  </div>`;
  document.body.append(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  const close = () => { wrap.classList.remove("open"); setTimeout(() => wrap.remove(), 260); };
  wrap.querySelector(".sheet-backdrop").onclick = close;
  const vIn = wrap.querySelector("#upVideo"), tIn = wrap.querySelector("#upTitle");
  vIn.onchange = () => { if (vIn.files[0] && !tIn.value) tIn.value = vIn.files[0].name.replace(/\.[^.]+$/, ""); };
  wrap.querySelector("#upGo").onclick = async () => {
    const msg = wrap.querySelector("#upMsg");
    const video = vIn.files[0], subsFile = wrap.querySelector("#upSubs").files[0], pasted = wrap.querySelector("#upPaste").value;
    if (!video) return (msg.textContent = "Choose a video file first.");
    let cues = [];
    if (subsFile) cues = parseSubtitles(await subsFile.text(), subsFile.name);
    else if (pasted.trim()) cues = parseSubtitles(pasted);
    if (!cues.length) return (msg.textContent = "Add a Japanese subtitle file or paste the Japanese lines, so Kitsu can understand the video.");
    if (!hasJapanese(cues.map(c => c.text).join(""))) return (msg.textContent = "These subtitles don't look Japanese. Kitsu needs the Japanese subtitles.");
    msg.textContent = "Saving…";
    const id = "v" + Date.now();
    const thumb = await makeThumb(video).catch(() => "");
    let stored = true;
    try { await VDB.put({ id, blob: video, cues }); } catch (_) { stored = false; sessionVideos[id] = { blob: video, cues }; }
    state.videos[id] = { title: tIn.value.trim() || video.name, created: Date.now(), cueCount: cues.length, level: estimateLevel(cues), levelSource: "estimate", thumb, steps: {}, stored };
    save();
    close();
    analyzeVideo(id, cues);
  };
}

function makeThumb(file) {
  return new Promise((res, rej) => {
    const v = document.createElement("video"), url = URL.createObjectURL(file);
    v.muted = true; v.preload = "metadata"; v.src = url;
    const fail = () => { URL.revokeObjectURL(url); rej(); };
    v.onerror = fail;
    v.onloadedmetadata = () => { v.currentTime = Math.min(30, (v.duration || 10) * 0.15); };
    v.onseeked = () => {
      const c = document.createElement("canvas"), w = 240, h = Math.round(w * (v.videoHeight / v.videoWidth || .5625));
      c.width = w; c.height = h; c.getContext("2d").drawImage(v, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { res(c.toDataURL("image/jpeg", 0.6)); } catch (_) { rej(); }
    };
    setTimeout(fail, 8000);
  });
}

async function loadVideo(id) {
  if (sessionVideos[id]) return sessionVideos[id];
  try { return await VDB.get(id); } catch (_) { return null; }
}

async function analyzeVideo(id, cues) {
  const v = state.videos[id];
  document.body.classList.add("in-lesson");
  $view.innerHTML = `<div class="lesson done">
    <h2>Kitsu is watching…</h2>
    ${Mascot.bubbleHtml({ jp: "字幕を読んでいるよ！", en: "Reading the subtitles to find the level and make your lesson…" }, "wink", 110, "finish-kitsu")}
    <div class="scan"><span></span></div>
    <p class="muted">${esc(v.title)} · ${cues.length} lines</p>
    <div class="spacer"></div>
    <button class="btn secondary" id="skipAi">Skip — just watch</button>
  </div>`;
  const ctl = new AbortController();
  document.getElementById("skipAi").onclick = () => { ctl.abort(); openVideo(id); };
  try {
    const a = await aiJson(analysisPrompt(v.title, cues), { signal: ctl.signal, cache: false });
    const str = x => (typeof x === "string" ? x.trim() : "");
    const level = ["A1", "A2", "B1", "B2", "C1", "C2"].includes(str(a.level)) ? str(a.level) : v.level;
    v.analysis = {
      why: str(a.why), summary: str(a.summary),
      vocab: (a.vocab || []).map(w => ({ id: "vocab:" + str(w.jp), jp: str(w.jp), kana: str(w.kana) !== str(w.jp) ? str(w.kana) : undefined, romaji: str(w.romaji), en: str(w.en), type: "vocab" })).filter(w => w.jp && w.en),
      questions: (a.questions || []).map(q => ({ q: str(q.q), options: (q.options || []).map(str), answer: str(q.answer) })).filter(q => q.q && q.options.includes(q.answer)),
      translate: (a.translate || []).map(t => ({ i: Number(t.i), en: str(t.en) })).filter(t => cues[t.i] && t.en),
    };
    v.level = level; v.levelSource = "ai"; save();
    v.analysis.vocab.forEach(w => (ALL_ITEMS[w.id] = ALL_ITEMS[w.id] || w));
    Mascot.sfx("finish");
    if (!ctl.signal.aborted) openVideo(id, true);
  } catch (e) {
    if (e?.code === "cancelled" || ctl.signal.aborted) return;
    toast(aiErrorText(e));
    openVideo(id);
  }
}
// Restore AI vocab into ALL_ITEMS so review works across visits.
Object.values(state.videos).forEach(v => (v.analysis?.vocab || []).forEach(w => (ALL_ITEMS[w.id] = ALL_ITEMS[w.id] || w)));

// ---------- the video lesson ----------
let player = null; // { video, cues, url, stopAt }
function closePlayer() { if (player) { player.video.pause(); URL.revokeObjectURL(player.url); player = null; } }

async function openVideo(id, justAnalyzed = false, step = null) {
  const v = state.videos[id];
  const rec = await loadVideo(id);
  document.body.classList.add("in-lesson");
  if (typeof stopAmbient === "function") stopAmbient();
  if (!rec) {
    $view.innerHTML = `<div class="lesson done"><h2>Video not found</h2><p>This video isn't stored in this browser anymore (it may have been cleared). You can remove it and add it again.</p>
      <div class="spacer"></div><button class="btn" id="rm">Remove from library</button><button class="btn secondary" id="bk" style="margin-top:10px">Back</button></div>`;
    document.getElementById("rm").onclick = () => { delete state.videos[id]; save(); setTab("watch"); };
    document.getElementById("bk").onclick = () => setTab("watch");
    return;
  }
  closePlayer();
  const cues = rec.cues, timed = cues.some(c => c.start !== null);
  step = step || (!v.steps.subs ? "subs" : !v.steps.nosubs ? "nosubs" : "quiz");
  const info = LEVELS.find(l => l.id === v.level);
  const a = v.analysis;
  swapView(() => {
    $view.innerHTML = `<div class="lesson watch">
      <div class="lesson-top"><button class="icon-btn" id="vClose" aria-label="Back">✕</button>
        <div style="flex:1;min-width:0"><b class="clip">${esc(v.title)}</b></div>
        <span class="lvl-badge region-${v.level}">${v.level}${v.levelSource === "ai" ? "" : "?"}</span>
        <button class="icon-btn" id="vNote" aria-label="Notes">📝</button></div>
      <div class="steps-bar">${[["subs", "① With subs"], ["nosubs", "② No subs"], ["quiz", "③ Quiz"]].map(([k, l]) =>
        `<button class="step-pill ${k === step ? "active" : ""} ${v.steps[k] ? "done" : ""}" data-step="${k}">${v.steps[k] ? "✓ " : ""}${l}</button>`).join("")}</div>
      <div id="stage"></div>
      ${justAnalyzed && a ? `<div class="card level-reveal">${Mascot.bubbleHtml({ jp: `この動画は${v.level}レベルだよ！`, en: `This video is ${v.level} (${info.name}, ≈ JLPT ${info.jlpt}). ${a.why}` }, v.level === currentLevel().id ? "happy" : "wow", 64)}</div>` : ""}
      ${a?.summary ? `<details class="card"><summary><b>Summary</b> <span class="muted">(spoiler)</span></summary><p>${esc(a.summary)}</p></details>` : ""}
      ${a?.vocab?.length ? `<div class="card"><b>Key words</b><div class="vocab-chips">${a.vocab.map(w => `<button class="vchip" data-id="${esc(w.id)}" title="${esc(w.en)}"><b>${esc(w.jp)}</b><small>${esc(w.en)}</small></button>`).join("")}</div>
        <button class="chip-btn" id="addAll" style="margin-top:10px">+ Add all to review</button></div>` : ""}
      ${!a ? `<div class="card"><p class="muted" style="margin:0 0 8px">${v.levelSource === "ai" ? "" : `Level ${v.level} is an estimate from the subtitles. `}Let Kitsu analyze the subtitles for an exact level, key words and a quiz.</p><button class="chip-btn" id="reAn">✨ Analyze with AI</button></div>` : ""}
      <button class="chip-btn danger" id="vDel">Delete this video</button>
    </div>`;
    document.getElementById("vClose").onclick = () => { closePlayer(); setTab("watch"); };
    document.getElementById("vNote").onclick = () => openNote("video-" + id, v.title);
    $view.querySelectorAll("[data-step]").forEach(b => b.onclick = () => openVideo(id, false, b.dataset.step));
    $view.querySelectorAll(".vchip").forEach(b => b.onclick = () => { const w = ALL_ITEMS[b.dataset.id]; speak(w.kana || w.jp); toast(`${w.jp} — ${w.en}`); });
    document.getElementById("addAll")?.addEventListener("click", () => {
      a.vocab.forEach(w => { if (!state.srs[w.id]) state.srs[w.id] = { box: 0, due: Date.now(), seen: 0, right: 0 }; });
      save(); toast(`Added ${a.vocab.length} words to review`); Mascot.sfx("right");
    });
    document.getElementById("reAn")?.addEventListener("click", () => analyzeVideo(id, cues));
    document.getElementById("vDel").onclick = () => askConfirm("Delete this video from this device?", "Delete").then(async ok => {
      if (!ok) return; closePlayer(); try { await VDB.del(id); } catch (_) {} delete sessionVideos[id]; delete state.videos[id]; save(); setTab("watch");
    });
    const stage = document.getElementById("stage");
    if (step === "quiz") renderVideoQuiz(id, stage, rec);
    else renderPlayerStage(id, stage, rec, step, timed);
  });
}

function renderPlayerStage(id, stage, rec, step, timed) {
  const v = state.videos[id], cues = rec.cues, withSubs = step === "subs";
  const url = URL.createObjectURL(rec.blob);
  stage.innerHTML = `
    <div class="player">
      <video id="vid" src="${url}" controls playsinline preload="metadata"></video>
      ${timed ? `<div class="sub-line" id="subLine" ${withSubs ? "" : "hidden"}></div>` : ""}
    </div>
    <div id="vidErr" class="feedback bad" hidden>This browser can't play this video file here. Try an .mp4 (H.264) file.</div>
    <div class="player-tools">
      ${withSubs ? `<span class="muted">Tap the subtitle to pause and translate it.</span>` : `<button class="chip-btn" id="reveal">👀 What did they say?</button><button class="chip-btn" id="back5">⏪ 5s</button>`}
    </div>
    <div id="lineBox"></div>
    ${!timed ? `<div class="card transcript"><b>Transcript</b>${cues.map((c, i) => `<button class="tline" data-i="${i}">${esc(c.text)}</button>`).join("")}</div>` : ""}
    <button class="btn" id="stepDone">${withSubs ? "I watched it → watch without subtitles" : "I watched it → take the quiz"}</button>`;
  const video = stage.querySelector("#vid");
  player = { video, cues, url, stopAt: null };
  video.onerror = () => (stage.querySelector("#vidErr").hidden = false);
  const subLine = stage.querySelector("#subLine");
  let curIdx = -1;
  const cueAt = t => { let lo = 0, hi = cues.length - 1, f = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (cues[m].start <= t) { f = m; lo = m + 1; } else hi = m - 1; } return f >= 0 && t <= cues[f].end + 0.2 ? f : -1; };
  video.ontimeupdate = () => {
    if (player?.stopAt !== null && player && video.currentTime >= player.stopAt) { video.pause(); player.stopAt = null; }
    if (!subLine) return;
    const i = cueAt(video.currentTime);
    if (i !== curIdx) { curIdx = i; subLine.textContent = i >= 0 ? cues[i].text : ""; subLine.dataset.i = i; subLine.classList.toggle("empty", i < 0); }
  };
  const showLine = i => {
    if (i < 0) return;
    video.pause();
    explainLine(stage.querySelector("#lineBox"), cues, i, id);
  };
  if (subLine) subLine.onclick = () => showLine(Number(subLine.dataset.i));
  stage.querySelectorAll(".tline").forEach(b => b.onclick = () => showLine(Number(b.dataset.i)));
  stage.querySelector("#reveal")?.addEventListener("click", () => {
    const i = cueAt(video.currentTime);
    const near = i >= 0 ? i : cues.reduce((best, c, k) => (c.start !== null && c.start <= video.currentTime ? k : best), -1);
    if (near < 0) return toast("Play the video first");
    showLine(near);
  });
  stage.querySelector("#back5")?.addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 5); video.play(); });
  stage.querySelector("#stepDone").onclick = () => {
    v.steps[step] = true; save(); addXp(10); Mascot.sfx("right");
    openVideo(id, false, step === "subs" ? "nosubs" : "quiz");
  };
}

// Show a line with its translation (AI, cached per line).
async function explainLine(box, cues, i, id) {
  const c = cues[i];
  const v = state.videos[id];
  v.lineTr = v.lineTr || {};
  box.innerHTML = `<div class="card line-card">
    <div class="lc-jp">${esc(c.text)}</div>
    <div class="lc-tr" id="lcTr">${v.lineTr[i] ? "" : '<span class="muted">Translating…</span>'}</div>
    <div class="reading-tools">
      ${c.start !== null ? `<button class="chip-btn" id="lcReplay">🔁 Replay line</button>` : ""}
      <button class="chip-btn" id="lcSay">🔊 Read aloud</button>
      <button class="chip-btn" id="lcNote">📝 Save to notes</button>
    </div></div>`;
  const tr = box.querySelector("#lcTr");
  const fill = t => (tr.innerHTML = `<div>${esc(t.en)}</div>${t.romaji ? `<small class="muted">${esc(t.romaji)}</small>` : ""}${t.words ? `<div class="lc-words">${esc(t.words)}</div>` : ""}`);
  box.querySelector("#lcSay").onclick = () => speak(c.text);
  box.querySelector("#lcReplay")?.addEventListener("click", () => { player.video.currentTime = c.start; player.stopAt = c.end; player.video.play(); });
  box.querySelector("#lcNote").onclick = () => {
    const key = "video-" + id, n = state.notes[key] || { title: v.title, text: "", lesson: false };
    n.text = (n.text ? n.text + "\n" : "") + `${c.text}${v.lineTr[i] ? " — " + v.lineTr[i].en : ""}`;
    n.updated = Date.now(); state.notes[key] = n; save(); toast("Saved to your notes");
  };
  if (v.lineTr[i]) return fill(v.lineTr[i]);
  try {
    const prev = cues.slice(Math.max(0, i - 2), i).map(x => x.text).join(" / ");
    const t = await aiJson(`Translate this Japanese subtitle line for an English-speaking learner.
${prev ? `Previous lines (context): ${prev}\n` : ""}Line: ${c.text}
Reply with only JSON: {"en": "natural English translation", "romaji": "romaji of the line", "words": "2-4 key words with meanings, like: 学校 (gakkou) school · 行く (iku) go"}`, { modelTier: "quick" });
    v.lineTr[i] = { en: String(t.en || ""), romaji: String(t.romaji || ""), words: String(t.words || "") }; save();
    if (document.body.contains(tr)) fill(v.lineTr[i]);
  } catch (e) {
    if (document.body.contains(tr)) tr.innerHTML = `<span class="muted">${esc(aiErrorText(e))}</span>`;
  }
}

// ---------- quiz ----------
function renderVideoQuiz(id, stage, rec) {
  const v = state.videos[id], cues = rec.cues, a = v.analysis || {};
  const timed = cues.filter(c => c.start !== null && hasJapanese(c.text) && c.text.length >= 4 && c.text.length <= 40);
  const qs = [];
  (a.questions || []).forEach(q => qs.push({ kind: "mc", ...q }));
  shuffle(timed).slice(0, 3).forEach(c => {
    const others = shuffle(timed.filter(o => o !== c && o.text !== c.text)).slice(0, 3);
    if (others.length === 3) qs.push({ kind: "clip", cue: c, options: shuffle([c, ...others]) });
  });
  (a.translate || []).slice(0, 3).forEach(t => qs.push({ kind: "translate", cue: cues[t.i], model: t.en }));
  if (!qs.length) {
    stage.innerHTML = `<div class="card"><p>Not enough material for a quiz yet. ${a.questions ? "" : "Analyze the video with AI to get questions and translations."}</p></div>`;
    return;
  }
  const video = document.createElement("video");
  const url = URL.createObjectURL(rec.blob);
  video.src = url; video.playsInline = true; video.preload = "auto"; video.className = "quiz-vid";
  player = { video, cues, url, stopAt: null };
  video.ontimeupdate = () => { if (player?.stopAt !== null && video.currentTime >= player.stopAt) { video.pause(); player.stopAt = null; } };
  const playCue = c => { if (c?.start === null || c === undefined) return; video.currentTime = Math.max(0, c.start - 0.15); player.stopAt = c.end + 0.15; video.play().catch(() => {}); };
  let k = 0, right = 0, combo = 0;
  const order = [...qs.filter(q => q.kind === "mc"), ...qs.filter(q => q.kind === "clip"), ...qs.filter(q => q.kind === "translate")];
  const next = () => {
    if (k >= order.length) return finishQuiz();
    const q = order[k];
    stage.innerHTML = `<div class="quiz-head muted">Question ${k + 1} of ${order.length}</div><div id="qv"></div><div id="qbody"></div><div id="qfb"></div><button class="btn" id="qgo" disabled>Check</button>`;
    const qv = stage.querySelector("#qv"), body = stage.querySelector("#qbody"), go = stage.querySelector("#qgo"), fb = stage.querySelector("#qfb");
    let sel = null, done = false;
    const choose = opts => {
      body.querySelectorAll(".choice").forEach(c => c.onclick = () => { if (done) return; body.querySelectorAll(".choice").forEach(x => x.classList.remove("selected")); c.classList.add("selected"); sel = c.dataset.v; go.disabled = false; if (autoCheckOn()) go.click(); });
    };
    if (q.kind === "mc") {
      body.innerHTML = `<div class="prompt">${esc(q.q)}</div><div class="choices one-col stagger">${shuffle(q.options).map((o, i) => `<button class="choice" data-v="${esc(o)}" style="--i:${i}">${esc(o)}</button>`).join("")}</div>`;
      choose();
      go.onclick = () => grade(sel === q.answer, q.answer);
    } else if (q.kind === "clip") {
      qv.append(video);
      body.innerHTML = `<div class="prompt">🎧 Which line do you hear?</div><button class="chip-btn" id="replay">🔁 Play the clip</button>
        <div class="choices one-col stagger">${q.options.map((o, i) => `<button class="choice" data-v="${i}" style="--i:${i}">${esc(o.text)}</button>`).join("")}</div>`;
      body.querySelector("#replay").onclick = () => playCue(q.cue);
      playCue(q.cue);
      choose();
      go.onclick = () => grade(q.options[Number(sel)] === q.cue, q.cue.text);
    } else {
      if (q.cue.start !== null) qv.append(video);
      body.innerHTML = `<div class="prompt">✍️ Translate into English</div><div class="lc-jp" style="margin:8px 0">${esc(q.cue.text)}</div>
        ${q.cue.start !== null ? `<button class="chip-btn" id="replay">🔁 Hear it</button>` : ""}
        <textarea id="trAns" class="note-text" style="min-height:90px;margin-top:10px" placeholder="Your translation…"></textarea>`;
      body.querySelector("#replay")?.addEventListener("click", () => playCue(q.cue));
      if (q.cue.start !== null) playCue(q.cue);
      const ta = body.querySelector("#trAns");
      ta.oninput = () => (go.disabled = !ta.value.trim());
      go.onclick = async () => {
        if (done) return;
        go.disabled = true; go.textContent = "Kitsu is checking…";
        try {
          const r = await aiJson(`A learner translated a Japanese line into English. Grade it kindly but honestly.
Japanese: ${q.cue.text}
Reference translation: ${q.model}
Learner's translation: ${ta.value.trim()}
Reply with only JSON: {"score": 0-100 (meaning matters, not wording), "feedback": "1-2 encouraging sentences pointing out what was right and what was missed", "better": "a natural translation"}`, { modelTier: "quick", cache: false });
          const score = Math.max(0, Math.min(100, Number(r.score) || 0));
          grade(score >= 60, `${score}% · ${r.feedback || ""} Better: “${r.better || q.model}”`, true);
        } catch (e) {
          grade(null, `Model translation: “${q.model}”`, true);
        }
      };
    }
    function grade(ok, text, isText) {
      done = true;
      if (ok) { right++; combo++; } else if (ok === false) combo = 0;
      body.querySelectorAll(".choice").forEach(c => {
        const isRight = q.kind === "mc" ? c.dataset.v === q.answer : q.kind === "clip" ? q.options[Number(c.dataset.v)] === q.cue : false;
        if (isRight) c.classList.add("right"); else if (c.classList.contains("selected")) c.classList.add("wrong");
      });
      fb.innerHTML = `<div class="feedback ${ok === false ? "bad" : "ok"}">${ok === null ? "" : Mascot.react(ok, combo)}<div style="font-weight:400">${ok === false && !isText ? "Answer: " : ""}${esc(text)}</div></div>`;
      go.textContent = "Continue"; go.disabled = false;
      go.onclick = () => { k++; next(); };
      autoAdvance(go, isText ? false : ok !== false, () => go.click());
    }
  };
  const finishQuiz = () => {
    const pct = Math.round(100 * right / order.length);
    v.steps.quiz = true; v.best = Math.max(v.best || 0, pct); save();
    addXp(10 + Math.round(pct / 5));
    logActivity("video");
    stage.innerHTML = `<div class="done" style="padding-top:10px">${Mascot.finish(pct)}<p><b>${right}/${order.length}</b> correct · +${10 + Math.round(pct / 5)} XP</p>
      <div class="tr-actions"><button class="btn secondary" id="again">Try again</button><button class="btn" id="lib">Back to videos</button></div></div>`;
    Mascot.bindTap(stage);
    stage.querySelector("#again").onclick = () => openVideo(id, false, "quiz");
    stage.querySelector("#lib").onclick = () => { closePlayer(); setTab("watch"); };
  };
  next();
}
