"use strict";
// Voice studio: pick a voice model (any voice your browser/device offers), a style,
// and fine-tune speed & pitch — separately for lessons and for the mascot.
const VOICE_CFG = {
 "mascot": "Kitsu",
 "icon": "🦊",
 "lesson": "こんにちは！今日はいい天気ですね。一緒に日本語を勉強しましょう。",
 "mascotSample": "やっほー！キツだよ！今日もがんばろうね！",
 "male": "keita|ichiro|otoya|daichi|naoki|takumi|hattori|\\bmale",
 "female": "nanami|kyoko|haruka|ayumi|mizuki|o-ren|aoi|mayu|shiori|google|female",
 "strip": "microsoft |google |online|\\(natural\\)|desktop|- japanese.*|japanese|\\(japan\\)|日本語",
 "more": [
  [
   "Microsoft Edge",
   "Nanami ♀ · Keita ♂",
   "✨ Natural, free, nothing to install",
   "Open the app in Edge"
  ],
  [
   "Google Chrome",
   "Google 日本語 ♀",
   "Good quality, needs internet",
   "Open the app in Chrome"
  ],
  [
   "iPhone · iPad · Mac",
   "Kyoko ♀ · Otoya ♂",
   "✨ Natural if you download the Enhanced / Premium version",
   "Settings → Accessibility → Spoken Content → Voices → Japanese"
  ],
  [
   "Android",
   "Google voices I–IV",
   "✨ Natural",
   "Settings → Text-to-speech → Google → Install voice data → Japanese"
  ],
  [
   "Windows",
   "Haruka ♀ · Ayumi ♀ · Ichiro ♂",
   "🤖 Robotic",
   "Built in. Use Edge instead for natural voices"
  ]
 ]
};
const VOICE_PRESETS = [
  ["natural", "🎙️", "Natural", "Closest to a real person"],
  ["soft", "🌸", "Soft", "Gentle and sweet"],
  ["energetic", "⚡", "Energetic", "Bright and lively"],
  ["calm", "🍵", "Calm", "Slow and relaxed"],
  ["slow", "🐢", "Slow", "Extra slow, for learning"],
  ["anime", "🎭", "Anime", "Higher and playful"],
];
const voiceGender = n => new RegExp(VOICE_CFG.male, "i").test(n) ? "♂" : new RegExp(VOICE_CFG.female, "i").test(n) ? "♀" : "🗣";
const voiceShortName = n => (n.replace(new RegExp(VOICE_CFG.strip, "gi"), "").replace(/[()\-]+/g, " ").replace(/\s+/g, " ").trim()) || n;
function voiceSource(v) {
  const n = v.name || "";
  if (/online.*natural/i.test(n)) return "Edge";
  if (/google/i.test(n)) return "Google";
  if (/premium|enhanced|siri/i.test(n)) return "Apple HD";
  if (/microsoft/i.test(n)) return "Windows";
  return v.localService === false ? "Online" : "This device";
}

function openVoiceStudio(start = "lesson") {
  document.body.classList.add("in-lesson");
  if (typeof stopAmbient === "function") stopAmbient();
  let tab = start, first = true;
  const sample = () => (tab === "mascot" ? VOICE_CFG.mascotSample : VOICE_CFG.lesson);
  const play = name => TTS.speak(sample(), { character: tab === "mascot", voiceName: name || undefined, rate: 0.95 });
  const draw = () => {
    const isM = tab === "mascot", vs = TTS.list(), cur = TTS.currentFor(isM);
    const styleKey = isM ? (state.mascotStyle || "auto") : (state.voiceStyle || "natural");
    const presets = isM ? [["auto", "🎭", "Personality", `Follows ${VOICE_CFG.mascot}'s personality`], ...VOICE_PRESETS] : VOICE_PRESETS;
    const scroll = first ? 0 : $view.scrollTop;
    first = false;
    $view.innerHTML = `<div class="lesson studio">
      <div class="lesson-top"><button class="icon-btn" id="vsClose" aria-label="Close">✕</button><div style="flex:1"><b>🎚️ Voice studio</b></div></div>
      <div class="studio-tabs">
        <button class="${!isM ? "on" : ""}" data-tab2="lesson">📚 Lessons</button>
        <button class="${isM ? "on" : ""}" data-tab2="mascot">${VOICE_CFG.icon} ${VOICE_CFG.mascot}</button>
      </div>
      ${!vs.length ? `<div class="voice-tip">No voice for this language was found in this browser. See “Get more natural voices” below.</div>`
        : !TTS.isNatural(vs[0]) ? `<div class="voice-tip">🤖 All the voices in this browser sound robotic. The best fix: open the app in <b>Microsoft Edge</b>, which has free natural voices.</div>` : ""}
      <h3 class="studio-h"><span>1</span> Voice model <small>tap ▶ to listen</small></h3>
      <div class="model-list">
        ${isM ? `<div class="model-card ${!state.mascotVoiceName ? "on" : ""}"><button class="mc-main" data-pick=""><span class="mc-av">🔗</span><span class="mc-txt"><b>Same as lessons</b><small>Uses the lesson voice</small></span></button></div>` : ""}
        ${vs.map(v => {
          const on = isM ? state.mascotVoiceName === v.name : v.name === cur;
          return `<div class="model-card ${on ? "on" : ""}">
            <button class="mc-main" data-pick="${esc(v.name)}"><span class="mc-av">${voiceGender(v.name)}</span>
              <span class="mc-txt"><b>${esc(voiceShortName(v.name))}</b><small>${esc(voiceSource(v))} · ${esc(v.lang || "")}</small></span>
              <span class="vr-badge ${TTS.isNatural(v) ? "nat" : "rob"}">${TTS.isNatural(v) ? "✨ Natural" : "🤖 Robotic"}</span></button>
            <button class="mc-play" data-play="${esc(v.name)}" aria-label="Listen to ${esc(v.name)}">▶</button></div>`;
        }).join("")}
      </div>
      <h3 class="studio-h"><span>2</span> Style</h3>
      <div class="preset-grid">${presets.map(([k, ic, l, d]) => `<button class="preset ${styleKey === k ? "on" : ""}" data-preset="${k}"><span class="pr-ic">${ic}</span><b>${l}</b><small>${d}</small></button>`).join("")}</div>
      ${!isM ? `<h3 class="studio-h"><span>3</span> Fine-tune</h3>
        <div class="card sliders">
          <label for="vsRate"><span>🐇 Speed</span><b id="vsRateV">${Math.round((state.voiceRate || 1) * 100)}%</b></label>
          <input type="range" id="vsRate" min="0.6" max="1.4" step="0.05" value="${state.voiceRate || 1}">
          <label for="vsPitch"><span>🎵 Pitch</span><b id="vsPitchV">${Math.round((state.voicePitch || 1) * 100)}%</b></label>
          <input type="range" id="vsPitch" min="0.8" max="1.3" step="0.02" value="${state.voicePitch || 1}">
          <button class="chip-btn" id="vsTest">▶ Test these settings</button>
        </div>` : ""}
      <h3 class="studio-h"><span>✨</span> Get more natural voices</h3>
      <div class="card more-voices">${VOICE_CFG.more.map(([where, voices, q, how]) => `<div class="mv-row"><b>${where}</b><span>${voices}</span><small>${q}</small><small class="muted">${how}</small></div>`).join("")}</div>
      <button class="btn secondary" id="vsReset">Reset voice settings</button>
      <div style="height:16px"></div>
    </div>`;
    $view.scrollTop = scroll;
    document.getElementById("vsClose").onclick = () => setTab("profile");
    $view.querySelectorAll("[data-tab2]").forEach(b => b.onclick = () => { tab = b.dataset.tab2; first = true; draw(); });
    $view.querySelectorAll("[data-play]").forEach(b => b.onclick = () => play(b.dataset.play));
    $view.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
      if (isM) { if (b.dataset.pick) state.mascotVoiceName = b.dataset.pick; else delete state.mascotVoiceName; }
      else state.ttsVoice = b.dataset.pick;
      save(); draw(); play();
    });
    $view.querySelectorAll("[data-preset]").forEach(b => b.onclick = () => {
      if (isM) { if (b.dataset.preset === "auto") delete state.mascotStyle; else state.mascotStyle = b.dataset.preset; }
      else state.voiceStyle = b.dataset.preset;
      save(); draw(); play();
    });
    const rate = document.getElementById("vsRate"), pitch = document.getElementById("vsPitch");
    if (rate) {
      rate.oninput = () => (document.getElementById("vsRateV").textContent = Math.round(rate.value * 100) + "%");
      pitch.oninput = () => (document.getElementById("vsPitchV").textContent = Math.round(pitch.value * 100) + "%");
      rate.onchange = () => { state.voiceRate = +rate.value; save(); play(); };
      pitch.onchange = () => { state.voicePitch = +pitch.value; save(); play(); };
      document.getElementById("vsTest").onclick = () => play();
    }
    document.getElementById("vsReset").onclick = () => {
      ["ttsVoice", "mascotVoiceName", "voiceStyle", "mascotStyle", "voiceRate", "voicePitch"].forEach(k => delete state[k]);
      save(); draw(); toast("Voice settings reset");
    };
  };
  swapView(draw);
}
