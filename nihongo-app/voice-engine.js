"use strict";
// Voice engine: one place that decides HOW every sentence in the app is spoken.
//
// Priority order for each sentence:
//   1. A pre-generated neural recording (audio/manifest.json, made by tools/generate-audio.mjs
//      with Azure / Google / ElevenLabs / OpenAI). Same quality on every browser.
//   2. The browser's best neural voice for the chosen ACCENT and PROFILE
//      (Edge exposes Azure neural voices for free; Apple and Chrome have good ones too).
//   3. Nothing — never another accent or another language's voice (that is what produced
//      "a French voice reading Spanish"). The user gets an explanation instead.
//
// What we deliberately do NOT do any more: pitch shifting (the "robot chipmunk" effect) and
// chopping every sentence apart. Speed is changed through the synthesis rate, so neural voices
// recompute their intonation instead of stretching audio.
//
// Needs (per app, from voice-config.js): VOICE_LANG, VOICE_ACCENTS, VOICE_FEMALE, VOICE_MALE.

const VOICE_PROFILES = [
  { id: "f-soft", icon: "🌸", gender: "f", name: "Female · soft & warm", desc: "Gentle, warm, natural" },
  { id: "f-bright", icon: "☀️", gender: "f", name: "Female · clear & lively", desc: "Bright, dynamic, very clear" },
  { id: "m-calm", icon: "🌿", gender: "m", name: "Male · calm & natural", desc: "Relaxed, natural, reassuring" },
  { id: "m-deep", icon: "🎻", gender: "m", name: "Male · deep & warm", desc: "Lower, warm, steady" },
];
const VOICE_MODES = [
  { id: "teach", icon: "🎓", name: "Pedagogical pronunciation", desc: "Clear articulation, slower pace, pauses between phrases. Best for A1 and for new words." },
  { id: "natural", icon: "🗣️", name: "Native natural", desc: "Natural native prosody. The pace follows your level: calm at A1, native at B2+." },
  { id: "immersion", icon: "🌊", name: "Immersion", desc: "Native conversational speed, no simplification at all." },
];
// Speaking rate per level in "native natural" mode (1 = the voice's own natural pace).
const LEVEL_PACE = { A1: 0.84, A2: 0.9, B1: 0.95, B2: 1, C1: 1, C2: 1.04 };

const TTS = (() => {
  const ok = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let voices = [], unlocked = false, keep = [], timer = null, player = null;
  let clips = null; // pre-generated audio manifest, if the app ships one

  const norm = l => (l || "").replace("_", "-").toLowerCase();
  const accent = () => VOICE_ACCENTS.find(a => a.id === state.accent) || VOICE_ACCENTS[0];
  const accentById = id => VOICE_ACCENTS.find(a => a.id === id);
  const langVoices = () => voices.filter(v => norm(v.lang).startsWith(VOICE_LANG.code));
  const accentVoices = acc => voices.filter(v => norm(v.lang) === acc.id.toLowerCase());
  const accentOfVoice = v => VOICE_ACCENTS.find(a => a.id.toLowerCase() === norm(v.lang));

  // How human a voice sounds. Cloud / neural voices beat the old desktop generation by far.
  const quality = v => {
    const n = (v.name || "").toLowerCase();
    let q = 0;
    if (/natural|neural|online|premium|enhanced|wavenet|studio|chirp/.test(n)) q += 100;
    if (/google/.test(n)) q += 60;
    if (v.localService === false) q += 15;
    if (/desktop|compact|espeak|mbrola/.test(n)) q -= 40;
    return q;
  };
  const isNatural = v => !!v && quality(v) >= 60;
  const gender = v => (VOICE_MALE.test(v.name) ? "m" : VOICE_FEMALE.test(v.name) ? "f" : "?");
  const best = list => [...list].sort((a, b) => quality(b) - quality(a))[0] || null;

  // The voice that best fits an accent + profile. Never crosses accents.
  function pickFor(acc, profileId) {
    const vs = accentVoices(acc);
    if (!vs.length) return { voice: null, exact: false };
    const prof = VOICE_PROFILES.find(p => p.id === profileId) || VOICE_PROFILES[0];
    for (const re of acc.profiles[prof.id] || []) {
      const hit = best(vs.filter(v => re.test(v.name)));
      if (hit) return { voice: hit, exact: gender(hit) === prof.gender || gender(hit) === "?" };
    }
    const same = best(vs.filter(v => gender(v) === prof.gender));
    if (same) return { voice: same, exact: true };
    return { voice: best(vs), exact: false };
  }
  // Which voice speaks right now (lessons, or the mascot).
  function resolve(character, voiceName) {
    if (voiceName) return voices.find(v => v.name === voiceName) || null;
    const acc = accent();
    const manual = character ? state.mascotVoiceName : state.ttsVoice;
    const mv = manual && voices.find(v => v.name === manual && norm(v.lang) === acc.id.toLowerCase());
    if (mv) return mv;
    const profile = character ? (state.mascotProfile || "f-bright") : (state.voiceProfile || "f-soft");
    return pickFor(acc, profile).voice;
  }

  // Pace: mode × level × user's fine-tune × the caller's own intent (e.g. a "slow" button).
  function pace(callerRate) {
    const mode = state.voiceMode || "natural";
    const lvl = typeof currentLevel === "function" ? currentLevel().id : "A1";
    let base = mode === "teach" ? 0.8 : mode === "immersion" ? 1.04 : (state.adaptPace === false ? 0.97 : LEVEL_PACE[lvl] || 1);
    const intent = (callerRate ?? 0.9) / 0.9;
    return Math.max(0.5, Math.min(1.5, base * intent * (state.voiceRate || 1)));
  }
  // Natural mode keeps the whole utterance together so the neural voice can shape its melody.
  // Pedagogical mode adds real pauses between sentences and phrases.
  function chunks(text) {
    if ((state.voiceMode || "natural") !== "teach") {
      return text.length > 220 ? text.split(/(?<=[。！？!?]|[.](?=\s))\s*/).filter(Boolean).map(t => ({ t, pause: 120 })) : [{ t: text, pause: 0 }];
    }
    const out = [];
    for (const s of text.split(/(?<=[。！？!?]|[.](?=\s))\s*/).filter(Boolean)) {
      const parts = s.split(/(?<=[、，,;])\s*/).filter(Boolean);
      parts.forEach((p, i) => out.push({ t: p, pause: i < parts.length - 1 ? 280 : 520 }));
    }
    return out.length ? out : [{ t: text, pause: 0 }];
  }

  // ---- pre-generated recordings ----
  const hash = s => { let h = 0x811c9dc5; for (const ch of s.trim().normalize("NFC")) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
  fetch("audio/manifest.json").then(r => (r.ok ? r.json() : null)).then(m => { if (m && m.clips) clips = m; }).catch(() => {});
  function clipFor(text, character) {
    if (!clips) return null;
    const entry = clips.clips[hash(text)];
    if (!entry) return null;
    const acc = accent().id, profile = character ? (state.mascotProfile || "f-bright") : (state.voiceProfile || "f-soft");
    const ids = Object.keys(clips.voices).filter(id => clips.voices[id].accent === acc);
    const id = ids.find(i => clips.voices[i].profile === profile && entry[i]) || ids.find(i => entry[i]);
    if (!id) return null;
    const mode = state.voiceMode || "natural";
    return { src: "audio/" + (entry[id][mode] || entry[id].natural), voice: clips.voices[id], slowed: mode === "teach" && !entry[id].teach };
  }

  // ---- loading & unlocking ----
  const load = () => { if (!ok) return; try { voices = speechSynthesis.getVoices() || []; } catch (_) {} };
  if (ok) {
    load();
    try { speechSynthesis.addEventListener("voiceschanged", load); } catch (_) { speechSynthesis.onvoiceschanged = load; }
    [300, 1000, 2500, 5000].forEach(t => setTimeout(load, t));
  }
  const unlock = () => {
    if (unlocked || !ok) return;
    unlocked = true;
    try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; u.lang = accent().id; speechSynthesis.speak(u); } catch (_) {}
  };
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });

  function stopAll() {
    clearTimeout(timer);
    if (player) { player.pause(); player = null; }
    if (ok) speechSynthesis.cancel();
  }

  // speak(text, { rate, onend, character, voiceName, legacy })
  function speak(text, { rate, onend, character = false, voiceName, legacy = false } = {}) {
    let fired = false;
    const end = () => { if (!fired) { fired = true; onend?.(); } };
    if (!text) { setTimeout(end, 100); return false; }
    stopAll();

    // 1. a real neural recording
    const clip = !voiceName && !legacy && clipFor(text, character);
    if (clip) {
      const a = new Audio(clip.src);
      a.preservesPitch = true;
      a.playbackRate = clip.slowed ? 0.88 : Math.max(0.8, Math.min(1.25, (state.voiceRate || 1) * ((rate ?? 0.9) / 0.9)));
      a.onended = a.onerror = end;
      player = a;
      a.play().catch(end);
      return true;
    }
    if (!ok) { setTimeout(end, 200); return false; }

    // 2. the browser's neural voice for this accent
    const chosen = legacy ? legacyVoice() : resolve(character, voiceName);
    if (!chosen) { setTimeout(end, 200); if (typeof noVoiceNotice === "function") noVoiceNotice(langVoices().length); return false; }
    const r = legacy ? 0.96 : pace(rate);
    const pitch = legacy ? 1.45 : 1; // legacy = how the old version sounded (for the before/after lab only)
    const list = legacy ? text.split(/(?<=[。！？!?]|[.](?=\s))\s*/).filter(Boolean).map(t => ({ t, pause: 170 })) : chunks(text);
    let i = 0;
    const next = () => {
      if (i >= list.length) return end();
      const { t, pause } = list[i++];
      try {
        const u = new SpeechSynthesisUtterance(t);
        u.voice = chosen; u.lang = chosen.lang || accent().id; u.rate = r; u.pitch = pitch;
        u.onend = () => { keep = keep.filter(x => x !== u); if (i < list.length) timer = setTimeout(next, pause); else end(); };
        u.onerror = () => { keep = keep.filter(x => x !== u); end(); };
        keep.push(u);
        if (speechSynthesis.paused) speechSynthesis.resume();
        speechSynthesis.speak(u);
      } catch (_) { end(); }
    };
    if (speechSynthesis.speaking || speechSynthesis.pending) timer = setTimeout(next, 90); else next();
    setTimeout(end, 2500 + list.length * 600 + (text.length * 280) / r);
    return true;
  }
  // How the previous version picked a voice: first one of the language with a "female" name,
  // regardless of quality or region. Only used by the voice lab's "before" button.
  function legacyVoice() { const vs = langVoices(); return vs.find(v => VOICE_FEMALE.test(v.name)) || vs[0] || null; }

  return {
    speak, cancel: stopAll, quality, isNatural, gender, pickFor, accent, accentById, accentOfVoice, hash,
    voices: () => { load(); return voices; },
    list: () => { load(); return [...langVoices()].sort((a, b) => quality(b) - quality(a)); },
    accentVoices: acc => { load(); return accentVoices(acc); },
    current: () => { load(); return resolve(false)?.name || ""; },
    currentFor: character => { load(); return resolve(character)?.name || ""; },
    clipsLoaded: () => (clips ? Object.keys(clips.clips).length : 0),
    clipVoices: () => (clips ? clips.voices : {}),
    status: () => { load(); const v = resolve(false); return { supported: ok, voices: voices.length, ja: v ? `${v.name} (${v.lang})` : null, accent: accent() }; },
  };
})();
