"use strict";
// Voice settings (accent, voice profile, pace & pronunciation mode, speed) and the Voice lab
// (same test sentences on every voice, before/after the redesign, scored on 7 criteria).

const voiceShortName = n => (n || "").replace(/microsoft |google |online|\(natural\)|desktop|- .*$/gi, "").replace(/[()]+/g, " ").replace(/\s+/g, " ").trim() || n;
function voiceSource(v) {
  const n = v.name || "";
  if (/online.*natural/i.test(n)) return "Edge · Azure neural";
  if (/google/i.test(n)) return "Google neural";
  if (/premium|enhanced|siri/i.test(n)) return "Apple HD";
  if (/microsoft/i.test(n)) return "Windows (old generation)";
  return v.localService === false ? "Online" : "This device";
}
const qBadge = v => `<span class="vr-badge ${TTS.isNatural(v) ? "nat" : "rob"}">${TTS.isNatural(v) ? "✨ Neural" : "🤖 Robotic"}</span>`;
const genderIcon = g => (g === "m" ? "♂" : g === "f" ? "♀" : "🗣");

// ---------------- Voice settings ----------------
function openVoiceStudio(start = "lesson") {
  document.body.classList.add("in-lesson");
  if (typeof stopAmbient === "function") stopAmbient();
  let target = start, first = true;
  const sample = acc => (target === "mascot" ? MASCOT_SAMPLE : (acc || TTS.accent()).sample);
  const wave = on => document.getElementById("vsWave")?.classList.toggle("playing", on);
  const play = (opts = {}) => { wave(true); TTS.speak(opts.text || sample(opts.acc), { character: target === "mascot", voiceName: opts.voiceName, onend: () => wave(false) }); };
  const draw = () => {
    const isM = target === "mascot", acc = TTS.accent(), profKey = isM ? "mascotProfile" : "voiceProfile";
    const curProfile = state[profKey] || (isM ? "f-bright" : "f-soft"), mode = state.voiceMode || "natural";
    const modeObj = VOICE_MODES.find(m => m.id === mode) || VOICE_MODES[1];
    const scroll = first ? 0 : $view.scrollTop; first = false;
    const accVoices = TTS.accentVoices(acc), others = TTS.list().filter(v => !accVoices.includes(v));
    const cur = TTS.voices().find(v => v.name === TTS.currentFor(isM));
    const rate = state.voiceRate || 1;
    const avail = a => { const n = TTS.accentVoices(a).length, neural = TTS.accentVoices(a).some(v => TTS.isNatural(v)); return n ? (neural ? "ok" : "meh") : "no"; };
    $view.innerHTML = `<div class="lesson studio studio3">
      <div class="lesson-top"><button class="icon-btn" id="vsClose" aria-label="Close">✕</button><div style="flex:1"><b>🎚️ Voice settings</b> <small class="muted">${VOICE_LANG.name}</small></div>
        <button class="chip-btn" id="vsLab">🧪 Lab</button></div>

      <div class="vs-player region-${typeof currentLevel === "function" ? currentLevel().id : "A1"}">
        <div class="vp-disc ${cur && TTS.gender(cur) === "m" ? "m" : "f"}">${cur ? (TTS.gender(cur) === "m" ? "♂" : "♀") : "🔇"}</div>
        <div class="vp-info"><small>${isM ? `${VOICE_LANG.icon} ${esc(VOICE_LANG.mascot)}'s voice` : "📚 Lesson voice"}</small>
          <b>${cur ? esc(voiceShortName(cur.name)) : "No voice for this accent"}</b>
          <span>${acc.flag} ${esc(acc.name)} · ${modeObj.icon} ${esc(modeObj.name)}</span></div>
        <button class="vp-play" id="vsTest" aria-label="Play a sample" ${cur ? "" : "disabled"}>▶</button>
        <div class="vp-wave" id="vsWave" aria-hidden="true">${Array.from({ length: 32 }, (_, i) => `<i style="--k:${i}"></i>`).join("")}</div>
        <p class="vp-text">“${esc(sample())}”</p>
      </div>

      <h3 class="studio-h"><span>1</span> Accent</h3>
      <div class="flag-row">${VOICE_ACCENTS.map(a => `<button class="flag-btn ${a.id === acc.id ? "on" : ""}" data-accent="${a.id}">
        <span class="fb-flag">${a.flag}</span><b>${esc(a.name.split("·").pop().trim())}</b><small>${esc(a.name.split("·")[0].trim())}</small><i class="dot ${avail(a)}"></i></button>`).join("")}</div>
      <div class="accent-detail">
        <p>${esc(acc.note)}</p>
        <div class="ad-foot"><span class="${avail(acc)}">${accVoices.length ? `${avail(acc) === "ok" ? "✨" : "🤖"} ${accVoices.length} voice${accVoices.length > 1 ? "s" : ""} for ${esc(acc.native)} in this browser` : "✗ No voice for this accent here. Open the app in Microsoft Edge"}</span>
          <button class="chip-btn" data-play-accent="${acc.id}" ${accVoices.length ? "" : "disabled"}>▶ Hear the accent</button></div>
      </div>

      <h3 class="studio-h"><span>2</span> Voice</h3>
      <div class="segmented" role="tablist">
        <button class="${!isM ? "on" : ""}" data-target="lesson" role="tab">📚 Lessons</button>
        <button class="${isM ? "on" : ""}" data-target="mascot" role="tab">${VOICE_LANG.icon} ${esc(VOICE_LANG.mascot)}</button>
      </div>
      <div class="avatar-grid">${VOICE_PROFILES.map(p => {
        const { voice, exact } = TTS.pickFor(acc, p.id);
        return `<div class="av-card ${p.id === curProfile ? "on" : ""} ${p.gender}">
          <button class="av-main" data-profile="${p.id}">
            <span class="av-face"><span>${p.icon}</span><i>${p.gender === "m" ? "♂" : "♀"}</i></span>
            <b>${esc(p.name.split("·")[1].trim())}</b><small>${p.gender === "m" ? "Male" : "Female"} · ${esc(p.desc)}</small>
            <span class="av-voice">${voice ? `${esc(voiceShortName(voice.name))}${exact ? "" : " · closest"}` : "Not available"}</span>
          </button>
          <button class="av-play" data-play-profile="${p.id}" ${voice ? "" : "disabled"} aria-label="Listen to ${esc(p.name)}">▶</button>
        </div>`;
      }).join("")}</div>

      <h3 class="studio-h"><span>3</span> Speaking style</h3>
      <div class="segmented three" role="radiogroup">${VOICE_MODES.map(m => `<button role="radio" aria-checked="${m.id === mode}" class="${m.id === mode ? "on" : ""}" data-mode="${m.id}">${m.icon}<span>${esc(m.name.replace("Pedagogical pronunciation", "Teaching").replace("Native natural", "Natural"))}</span></button>`).join("")}</div>
      <p class="mode-desc">${esc(modeObj.desc)}</p>
      <div class="set-group flat">
        <label class="set-row" for="vsAdapt"><span class="set-ic" style="--c:#22b07d">📈</span><span class="set-txt"><b>Pace follows my level</b><small>Now ${typeof currentLevel === "function" ? currentLevel().id : "A1"}: calmer at A1, native from B2 · Natural style only</small></span>
          <input type="checkbox" class="switch" id="vsAdapt" ${state.adaptPace !== false ? "checked" : ""} ${mode === "natural" ? "" : "disabled"}></label>
        <div class="speed-box">
          <div class="sb-head"><b>🐇 Speed</b><span id="vsRateV">${Math.round(rate * 100)}%</span></div>
          <input type="range" id="vsRate" min="0.7" max="1.3" step="0.05" value="${rate}" aria-label="Speed">
          <div class="sb-scale"><span>Slower</span><span>Natural</span><span>Faster</span></div>
          <small class="muted">Changed inside the voice engine: a neural voice keeps its natural intonation. Pitch is never altered.</small>
        </div>
      </div>

      <details class="card vs-advanced"><summary><b>Advanced: pick an exact voice</b> <small class="muted">${accVoices.length} for this accent</small></summary>
        <div class="model-list" style="margin-top:10px">
          <div class="model-card ${!(isM ? state.mascotVoiceName : state.ttsVoice) ? "on" : ""}"><button class="mc-main" data-pick=""><span class="mc-av">✨</span><span class="mc-txt"><b>Automatic</b><small>Best voice for the profile above</small></span></button></div>
          ${accVoices.sort((a, b) => TTS.quality(b) - TTS.quality(a)).map(v => `<div class="model-card ${(isM ? state.mascotVoiceName : state.ttsVoice) === v.name ? "on" : ""}">
            <button class="mc-main" data-pick="${esc(v.name)}"><span class="mc-av">${genderIcon(TTS.gender(v))}</span><span class="mc-txt"><b>${esc(voiceShortName(v.name))}</b><small>${esc(voiceSource(v))} · ${esc(v.lang)}</small></span>${qBadge(v)}</button>
            <button class="mc-play" data-play="${esc(v.name)}" aria-label="Listen">▶</button></div>`).join("")}
          ${others.length ? `<small class="muted">Voices from other accents are hidden so accents never mix: ${others.map(v => esc(voiceShortName(v.name)) + " (" + esc(v.lang) + ")").join(", ")}.</small>` : ""}
        </div></details>

      ${TTS.clipsLoaded() ? `<div class="voice-tip">🎧 ${TTS.clipsLoaded()} sentences have studio-quality neural recordings, used automatically on every browser.</div>` : ""}
      <details class="card vs-advanced"><summary><b>✨ Where the natural voices come from</b></summary>
        <div class="more-voices" style="margin-top:10px">${VOICE_SOURCES.map(([where, vs, q, how]) => `<div class="mv-row"><b>${where}</b><span>${vs}</span><small>${q}</small><small class="muted">${how}</small></div>`).join("")}</div></details>
      <button class="btn secondary" id="vsReset">Reset voice settings</button><div style="height:16px"></div>
    </div>`;
    $view.scrollTop = scroll;
    document.getElementById("vsClose").onclick = () => setTab("profile");
    document.getElementById("vsLab").onclick = () => openVoiceLab();
    $view.querySelectorAll("[data-accent]").forEach(b => b.onclick = () => { state.accent = b.dataset.accent; delete state.ttsVoice; delete state.mascotVoiceName; save(); draw(); if (TTS.accentVoices(TTS.accent()).length) play(); });
    $view.querySelectorAll("[data-play-accent]").forEach(b => b.onclick = () => {
      const a = TTS.accentById(b.dataset.playAccent), v = TTS.pickFor(a, state.voiceProfile || "f-soft").voice;
      if (v) { wave(true); TTS.speak(a.sample, { voiceName: v.name, onend: () => wave(false) }); }
    });
    $view.querySelectorAll("[data-target]").forEach(b => b.onclick = () => { target = b.dataset.target; draw(); });
    $view.querySelectorAll("[data-profile]").forEach(b => b.onclick = () => {
      state[profKey] = b.dataset.profile; delete state[isM ? "mascotVoiceName" : "ttsVoice"]; save(); draw(); play();
    });
    $view.querySelectorAll("[data-play-profile]").forEach(b => b.onclick = () => { const v = TTS.pickFor(acc, b.dataset.playProfile).voice; if (v) play({ voiceName: v.name }); });
    $view.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { state.voiceMode = b.dataset.mode; save(); draw(); play(); });
    document.getElementById("vsAdapt").onchange = e => { state.adaptPace = e.target.checked; save(); };
    const r = document.getElementById("vsRate");
    r.oninput = () => (document.getElementById("vsRateV").textContent = Math.round(r.value * 100) + "%");
    r.onchange = () => { state.voiceRate = +r.value; save(); play(); };
    document.getElementById("vsTest").onclick = () => play();
    $view.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
      const k = isM ? "mascotVoiceName" : "ttsVoice";
      if (b.dataset.pick) state[k] = b.dataset.pick; else delete state[k];
      save(); draw(); play();
    });
    $view.querySelectorAll("[data-play]").forEach(b => b.onclick = () => play({ voiceName: b.dataset.play }));
    document.getElementById("vsReset").onclick = () => {
      ["ttsVoice", "mascotVoiceName", "voiceProfile", "mascotProfile", "voiceMode", "adaptPace", "voiceRate", "accent", "voiceStyle", "mascotStyle", "voicePitch"].forEach(k => delete state[k]);
      save(); draw(); toast("Voice settings reset");
    };
  };
  swapView(draw);
}

// ---------------- Voice lab ----------------
const LAB_CRITERIA = [["nat", "Human naturalness"], ["acc", "Accent authenticity"], ["pro", "Pronunciation"], ["int", "Intonation"], ["exp", "Expressiveness"], ["flu", "Fluidity"], ["aud", "Audio quality"]];
function openVoiceLab() {
  document.body.classList.add("in-lesson");
  if (typeof stopAmbient === "function") stopAmbient();
  state.voiceLab = state.voiceLab || {};
  let sIdx = 0, first = true;
  const draw = () => {
    const sentence = VOICE_TEST_SENTENCES[sIdx];
    const cands = TTS.list();
    const avg = name => { const r = state.voiceLab[name]; if (!r) return null; const v = LAB_CRITERIA.map(([k]) => r[k]).filter(Boolean); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const ranked = cands.filter(v => avg(v.name) !== null).sort((a, b) => avg(b.name) - avg(a.name));
    const scroll = first ? 0 : $view.scrollTop; first = false;
    $view.innerHTML = `<div class="lesson studio lab">
      <div class="lesson-top"><button class="icon-btn" id="labClose" aria-label="Close">✕</button><div style="flex:1"><b>🧪 Voice lab</b></div><button class="chip-btn" id="labSettings">🎚️ Settings</button></div>
      <p class="muted" style="margin:10px 0">The same test sentences on every ${VOICE_LANG.name} voice this browser offers. <b>Before</b> plays it the way the previous version did (first voice found, pitch ×1.45, sentences chopped). <b>After</b> plays it with the new engine (accent-matched voice, untouched pitch, natural prosody). Rate each voice on the 7 criteria to find your best one.</p>
      <div class="ab-pair card">
        <b>Quick before / after</b><small class="muted">with your current settings</small>
        <div class="tr-actions" style="margin-top:8px"><button class="btn secondary" id="abBefore">⏪ Before</button><button class="btn" id="abAfter">✨ After</button></div>
      </div>
      <div class="lab-sentences">${VOICE_TEST_SENTENCES.map((t, i) => `<button class="lab-s ${i === sIdx ? "on" : ""}" data-s="${i}">${esc(t)}</button>`).join("")}</div>
      ${!cands.length ? `<div class="voice-tip">🔇 No ${VOICE_LANG.name} voice in this browser, so there is nothing to compare. Open this page in <b>Microsoft Edge</b> (free Azure neural voices) and come back to the lab.</div>` : ""}
      ${ranked.length ? `<div class="card lab-rank"><b>🏆 Your ranking</b>${ranked.slice(0, 5).map((v, i) => `<div class="rank-row"><span>${["🥇", "🥈", "🥉", "4.", "5."][i]} ${esc(voiceShortName(v.name))} <small class="muted">${esc(v.lang)}</small></span><b>${avg(v.name).toFixed(1)}/5</b><button class="chip-btn" data-use="${esc(v.name)}">Use</button></div>`).join("")}</div>` : ""}
      <div class="lab-list">${cands.map(v => {
        const acc = TTS.accentOfVoice(v), r = state.voiceLab[v.name] || {}, a = avg(v.name);
        return `<div class="card lab-card">
          <div class="lab-head"><span class="mc-av">${genderIcon(TTS.gender(v))}</span><span class="mc-txt"><b>${esc(voiceShortName(v.name))}</b><small>${acc ? acc.flag + " " + esc(acc.name) : esc(v.lang)} · ${esc(voiceSource(v))}</small></span>${qBadge(v)}</div>
          <div class="tr-actions"><button class="btn secondary" data-before="${esc(v.name)}">⏪ Before</button><button class="btn" data-after="${esc(v.name)}">✨ After</button></div>
          <details><summary>${a !== null ? `Your score: <b>${a.toFixed(1)}/5</b>` : "Rate this voice"}</summary>
            <div class="crit-list">${LAB_CRITERIA.map(([k, label]) => `<div class="crit"><span>${label}</span><span class="stars">${[1, 2, 3, 4, 5].map(n => `<button class="star ${r[k] >= n ? "on" : ""}" data-rate="${esc(v.name)}|${k}|${n}" aria-label="${label} ${n}">★</button>`).join("")}</span></div>`).join("")}</div>
          </details></div>`;
      }).join("")}</div>
      ${Object.keys(TTS.clipVoices()).length ? `<div class="card"><b>🎧 Pre-generated neural recordings</b><p class="muted" style="margin:6px 0 0">${Object.values(TTS.clipVoices()).map(cv => esc(cv.label || cv.voice)).join(" · ")}. They play automatically in lessons for the matching accent and profile.</p></div>` : ""}
      <div style="height:16px"></div></div>`;
    $view.scrollTop = scroll;
    document.getElementById("labClose").onclick = () => setTab("profile");
    document.getElementById("labSettings").onclick = () => openVoiceStudio("lesson");
    document.getElementById("abBefore").onclick = () => TTS.speak(sentence, { legacy: true });
    document.getElementById("abAfter").onclick = () => TTS.speak(sentence);
    $view.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { sIdx = +b.dataset.s; draw(); TTS.speak(VOICE_TEST_SENTENCES[sIdx]); });
    $view.querySelectorAll("[data-before]").forEach(b => b.onclick = () => legacyOn(b.dataset.before, sentence));
    $view.querySelectorAll("[data-after]").forEach(b => b.onclick = () => TTS.speak(sentence, { voiceName: b.dataset.after }));
    $view.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => {
      const [name, k, n] = b.dataset.rate.split("|");
      (state.voiceLab[name] = state.voiceLab[name] || {})[k] = +n; save();
      draw(); // keep that voice's rating panel open after redrawing
      const panel = [...$view.querySelectorAll(".lab-card details")].find(d => d.querySelector(`[data-rate^="${CSS.escape(name)}|"]`));
      if (panel) panel.open = true;
    });
    $view.querySelectorAll("[data-use]").forEach(b => b.onclick = () => {
      const v = TTS.voices().find(x => x.name === b.dataset.use), acc = v && TTS.accentOfVoice(v);
      if (acc) state.accent = acc.id;
      state.ttsVoice = b.dataset.use; save(); toast(`Now using ${voiceShortName(b.dataset.use)}`); TTS.speak(sentence);
    });
  };
  // "Before" on a specific voice: that voice, processed the old way (pitch ×1.45, chopped).
  function legacyOn(name, text) {
    const v = TTS.voices().find(x => x.name === name);
    if (!v || !("speechSynthesis" in window)) return;
    TTS.cancel();
    const parts = text.split(/(?<=[。！？!?]|[.](?=\s))\s*/).filter(Boolean);
    let i = 0;
    const next = () => {
      if (i >= parts.length) return;
      const u = new SpeechSynthesisUtterance(parts[i++]);
      u.voice = v; u.lang = v.lang; u.pitch = 1.45; u.rate = 0.96;
      u.onend = () => setTimeout(next, 170);
      speechSynthesis.speak(u);
    };
    next();
  }
  swapView(draw);
}
