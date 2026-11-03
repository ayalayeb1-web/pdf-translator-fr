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
  const play = (opts = {}) => TTS.speak(opts.text || sample(opts.acc), { character: target === "mascot", voiceName: opts.voiceName });
  const draw = () => {
    const isM = target === "mascot", acc = TTS.accent(), profKey = isM ? "mascotProfile" : "voiceProfile";
    const curProfile = state[profKey] || (isM ? "f-bright" : "f-soft"), mode = state.voiceMode || "natural";
    const scroll = first ? 0 : $view.scrollTop; first = false;
    const accVoices = TTS.accentVoices(acc), others = TTS.list().filter(v => !accVoices.includes(v));
    $view.innerHTML = `<div class="lesson studio">
      <div class="lesson-top"><button class="icon-btn" id="vsClose" aria-label="Close">✕</button><div style="flex:1"><b>🎚️ Voice settings</b></div>
        <button class="chip-btn" id="vsLab">🧪 Voice lab</button></div>

      <div class="vs-lang"><span>Language</span><b>${VOICE_LANG.name}</b><small class="muted">${VOICE_LANG.other} is in the other app</small></div>

      <h3 class="studio-h"><span>1</span> Accent</h3>
      <div class="accent-list">${VOICE_ACCENTS.map(a => {
        const n = TTS.accentVoices(a).length, neural = TTS.accentVoices(a).some(v => TTS.isNatural(v));
        return `<div class="accent-card ${a.id === acc.id ? "on" : ""}">
          <button class="ac-main" data-accent="${a.id}"><span class="ac-flag">${a.flag}</span>
            <span class="ac-txt"><b>${esc(a.name)}</b><small>${esc(a.native)} · ${esc(a.note)}</small>
              <small class="${n ? (neural ? "ok" : "meh") : "no"}">${n ? `${neural ? "✨" : "🤖"} ${n} voice${n > 1 ? "s" : ""} in this browser` : "✗ No voice in this browser (open in Edge)"}</small></span></button>
          <button class="mc-play" data-play-accent="${a.id}" aria-label="Listen" ${n ? "" : "disabled"}>▶</button></div>`;
      }).join("")}</div>

      <h3 class="studio-h"><span>2</span> Voice</h3>
      <div class="studio-tabs">
        <button class="${!isM ? "on" : ""}" data-target="lesson">📚 Lessons</button>
        <button class="${isM ? "on" : ""}" data-target="mascot">${VOICE_LANG.icon} ${VOICE_LANG.mascot}</button>
      </div>
      <div class="profile-grid">${VOICE_PROFILES.map(p => {
        const { voice, exact } = TTS.pickFor(acc, p.id);
        return `<div class="profile-card ${p.id === curProfile ? "on" : ""}">
          <button class="pf-main" data-profile="${p.id}"><span class="pf-ic">${p.icon}</span><b>${p.name}</b><small>${p.desc}</small>
            <small class="pf-voice">${voice ? `${genderIcon(TTS.gender(voice))} ${esc(voiceShortName(voice.name))} ${exact ? "" : "· closest available"}` : "No voice here"}</small>
            ${voice ? qBadge(voice) : ""}</button>
          <button class="pf-play" data-play-profile="${p.id}" ${voice ? "" : "disabled"} aria-label="Listen">▶ Listen</button></div>`;
      }).join("")}</div>

      <h3 class="studio-h"><span>3</span> Pace &amp; pronunciation</h3>
      <div class="mode-list">${VOICE_MODES.map(m => `<button class="mode-card ${m.id === mode ? "on" : ""}" data-mode="${m.id}"><span class="pf-ic">${m.icon}</span><span><b>${m.name}</b><small>${m.desc}</small></span></button>`).join("")}</div>
      <div class="card sliders">
        <label class="toggle-row" for="vsAdapt"><span>📈 Adapt the pace to my level (now ${currentLevel().id})</span><input type="checkbox" id="vsAdapt" ${state.adaptPace !== false ? "checked" : ""} ${mode === "natural" ? "" : "disabled"}></label>
        <label for="vsRate"><span>🐇 Fine-tune speed</span><b id="vsRateV">${Math.round((state.voiceRate || 1) * 100)}%</b></label>
        <input type="range" id="vsRate" min="0.7" max="1.3" step="0.05" value="${state.voiceRate || 1}">
        <small class="muted">Speed is changed inside the voice engine, so a neural voice keeps its natural intonation when slowed down. Pitch is never altered.</small>
        <button class="chip-btn" id="vsTest">▶ Test with these settings</button>
      </div>

      <details class="card vs-advanced"><summary><b>Advanced: pick an exact voice</b> <small class="muted">${accVoices.length} for this accent</small></summary>
        <div class="model-list" style="margin-top:10px">
          <div class="model-card ${!(isM ? state.mascotVoiceName : state.ttsVoice) ? "on" : ""}"><button class="mc-main" data-pick=""><span class="mc-av">✨</span><span class="mc-txt"><b>Automatic</b><small>Best voice for the profile above</small></span></button></div>
          ${accVoices.sort((a, b) => TTS.quality(b) - TTS.quality(a)).map(v => `<div class="model-card ${(isM ? state.mascotVoiceName : state.ttsVoice) === v.name ? "on" : ""}">
            <button class="mc-main" data-pick="${esc(v.name)}"><span class="mc-av">${genderIcon(TTS.gender(v))}</span><span class="mc-txt"><b>${esc(voiceShortName(v.name))}</b><small>${esc(voiceSource(v))} · ${esc(v.lang)}</small></span>${qBadge(v)}</button>
            <button class="mc-play" data-play="${esc(v.name)}" aria-label="Listen">▶</button></div>`).join("")}
          ${others.length ? `<small class="muted">Other accents are hidden on purpose so accents never mix: ${others.map(v => esc(voiceShortName(v.name)) + " (" + esc(v.lang) + ")").join(", ")}.</small>` : ""}
        </div></details>

      ${TTS.clipsLoaded() ? `<div class="voice-tip">🎧 ${TTS.clipsLoaded()} sentences have studio-quality neural recordings. They're used automatically, on every browser.</div>` : ""}
      <h3 class="studio-h"><span>✨</span> Where the natural voices come from</h3>
      <div class="card more-voices">${VOICE_SOURCES.map(([where, vs, q, how]) => `<div class="mv-row"><b>${where}</b><span>${vs}</span><small>${q}</small><small class="muted">${how}</small></div>`).join("")}</div>
      <button class="btn secondary" id="vsReset">Reset voice settings</button><div style="height:16px"></div>
    </div>`;
    $view.scrollTop = scroll;
    document.getElementById("vsClose").onclick = () => setTab("profile");
    document.getElementById("vsLab").onclick = () => openVoiceLab();
    $view.querySelectorAll("[data-accent]").forEach(b => b.onclick = () => { state.accent = b.dataset.accent; delete state.ttsVoice; delete state.mascotVoiceName; save(); draw(); play(); });
    $view.querySelectorAll("[data-play-accent]").forEach(b => b.onclick = () => {
      const a = TTS.accentById(b.dataset.playAccent), v = TTS.pickFor(a, state.voiceProfile || "f-soft").voice;
      if (v) TTS.speak(a.sample, { voiceName: v.name });
    });
    $view.querySelectorAll("[data-target]").forEach(b => b.onclick = () => { target = b.dataset.target; draw(); });
    $view.querySelectorAll("[data-profile]").forEach(b => b.onclick = () => {
      state[profKey] = b.dataset.profile; delete state[isM ? "mascotVoiceName" : "ttsVoice"]; save(); draw(); play();
    });
    $view.querySelectorAll("[data-play-profile]").forEach(b => b.onclick = () => { const v = TTS.pickFor(acc, b.dataset.playProfile).voice; if (v) play({ voiceName: v.name }); });
    $view.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { state.voiceMode = b.dataset.mode; save(); draw(); play(); });
    document.getElementById("vsAdapt").onchange = e => { state.adaptPace = e.target.checked; save(); };
    const rate = document.getElementById("vsRate");
    rate.oninput = () => (document.getElementById("vsRateV").textContent = Math.round(rate.value * 100) + "%");
    rate.onchange = () => { state.voiceRate = +rate.value; save(); play(); };
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
