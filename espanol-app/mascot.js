"use strict";
// Lía — the app's mascot: a chibi Iberian lynx cub (lince ibérico) who cheers you on.
// Also holds the little "juice": sound effects, confetti, word of the day.

const Mascot = (() => {
  const L = (jp, romaji, en) => ({ jp, romaji, en });
  const LINES = {
    morning: [L("¡Buenos días! ¿Empezamos con energía?", "", "Good morning! Shall we start with energy?")],
    afternoon: [L("¡Buenas tardes! ¿Una lección rapidita?", "", "Good afternoon! A quick little lesson?")],
    evening: [L("¡Buenas noches! Solo una lección antes de dormir.", "", "Good evening! Just one lesson before bed.")],
    streak: [L("¡{n} días seguidos! ¡Qué crack!", "", "{n} days in a row! You're a star!")],
    due: [L("¡Tus tarjetas de repaso te esperan!", "", "Your review cards are waiting for you!")],
    right: [
      L("¡Muy bien!", "", "Very good!"), L("¡Genial!", "", "Great!"), L("¡Eso es!", "", "That's it!"),
      L("¡Perfecto!", "", "Perfect!"), L("¡Qué crack!", "", "You're a star!"), L("¡Olé!", "", "Olé!"),
    ],
    combo: [L("¡{n} seguidas! ¡Imparable!", "", "{n} in a row! Unstoppable!")],
    wrong: [
      L("¡No pasa nada!", "", "No worries!"), L("¡Casi!", "", "So close!"),
      L("Tranqui, la próxima sale.", "", "Relax, you'll get the next one."),
      L("¡Equivocarse es aprender!", "", "Making mistakes is learning!"),
    ],
    finishGreat: [L("¡Lo has bordado!", "", "You nailed it!")],
    finish: [L("¡Buen trabajo! ¡Lo has hecho genial!", "", "Good work! You did great!")],
    finishLow: [L("¡Buen intento! ¿Lo repetimos?", "", "Good try! Shall we do it again?")],
    tips: [
      L("En España se cena tarde: ¡a las nueve o las diez!", "", "In Spain people have dinner late: at nine or ten!"),
      L("En muchos bares de Granada, la tapa es gratis con la bebida.", "", "In many bars in Granada, the tapa comes free with your drink."),
      L("Soy un lince ibérico: ¡solo vivimos en España y Portugal!", "", "I'm an Iberian lynx: we only live in Spain and Portugal!"),
      L("Con amigos, usa «vosotros». ¡Es lo normal en España!", "", "With friends, use «vosotros». It's normal in Spain!"),
      L("La «z» y la «c» de «cerveza» suenan como «th» en inglés.", "", "The z and c in «cerveza» sound like English «th» in Spain."),
      L("Cinco minutos al día son mejor que nada. ¡Constancia!", "", "Five minutes a day beats nothing. Consistency!"),
      L("Mira series españolas con subtítulos en español.", "", "Watch Spanish series with Spanish subtitles."),
      L("«¿Me pone un café?» es la forma más natural de pedir en un bar.", "", "«¿Me pone un café?» is the most natural way to order in a bar."),
    ],
    placement: [L("¡Vamos a descubrir tu nivel!", "", "Let's find out your level!")],
  };
  // Gentle & polite personality: calm, warm, softly encouraging (original lines).
  const GENTLE = {
    morning: [L("Buenos días. ¿Te apetece aprender un poquito conmigo?", "", "Good morning. Would you like to learn a little with me?")],
    afternoon: [L("Buenas tardes. Vamos poco a poco, ¿vale?", "", "Good afternoon. Let's go step by step, OK?")],
    evening: [L("Buenas noches. ¿Una lección tranquila antes de dormir?", "", "Good evening. A calm lesson before bed?")],
    streak: [L("{n} días seguidos. Estoy muy orgullosa de ti.", "", "{n} days in a row. I'm very proud of you.")],
    due: [L("Vaya, vaya… tus tarjetas de repaso se acumulan.", "", "Well, well… your review cards are piling up.")],
    right: [
      L("Correcto. Muy bien hecho.", "", "Correct. Very well done."),
      L("Je, je… sabía que lo sabías.", "", "Hehe… I knew you knew it."),
      L("Lo haces de maravilla.", "", "You're doing wonderfully."),
      L("Así me gusta.", "", "That's how I like it."),
    ],
    combo: [L("{n} seguidas… vaya, vaya, qué nivel.", "", "{n} in a row… well, well, what a level.")],
    wrong: [
      L("Vaya, por poco.", "", "Oh, so close."),
      L("No te preocupes. La próxima seguro que sí.", "", "Don't worry. The next one for sure."),
      L("Je, je… equivocarse no está prohibido.", "", "Hehe… making mistakes isn't forbidden."),
      L("Sin prisa. Respira y sigue.", "", "No rush. Breathe and keep going."),
    ],
    finishGreat: [L("Perfecto. De verdad, eres estupendo.", "", "Perfect. Really, you're wonderful.")],
    finish: [L("Muy buen trabajo. Te lo has ganado.", "", "Very good work. You've earned it.")],
    finishLow: [L("Lo has intentado con ganas. Repetimos con calma.", "", "You tried hard. Let's repeat it calmly.")],
    placement: [L("¿Descubrimos juntos tu nivel?", "", "Shall we discover your level together?")],
  };
  const pickRaw = a => a[Math.floor(Math.random() * a.length)];
  // pick(LINES.x) → uses the gentle variant of that line set when that personality is on.
  const pick = a => {
    if (state.kitsuStyle === "gentle") for (const k in LINES) if (LINES[k] === a && GENTLE[k]) return pickRaw(GENTLE[k]);
    return pickRaw(a);
  };
  const fill = (line, n) => ({ jp: line.jp.replace("{n}", n), romaji: line.romaji.replace("{n}", n), en: line.en.replace("{n}", n) });

  // ---- drawing ----
  function svg(mood = "normal", size = 96) {
    const eyes = {
      happy: `<path d="M37 62 Q45 52 53 62" class="k-line"/><path d="M67 62 Q75 52 83 62" class="k-line"/>`,
      wink: `<path d="M37 62 Q45 52 53 62" class="k-line"/>${eye(75)}`,
      wow: `${eye(45, 1.2)}${eye(75, 1.2)}`,
      sad: `${eye(45, .85)}${eye(75, .85)}<path d="M36 50 L51 45" class="k-line"/><path d="M84 50 L69 45" class="k-line"/><path d="M84 68 q4 7 0 10 q-4 -3 0 -10z" fill="#7cc4ff"/>`,
      normal: `${eye(45)}${eye(75)}`,
    }[mood] || `${eye(45)}${eye(75)}`;
    const mouth = {
      happy: `<path d="M51 74 Q60 88 69 74 Z" fill="#ff7aa2" stroke="#2b2230" stroke-width="2.5" stroke-linejoin="round"/>`,
      wow: `<ellipse cx="60" cy="79" rx="6" ry="7" fill="#ff7aa2" stroke="#2b2230" stroke-width="2.5"/>`,
      sad: `<path d="M53 80 Q60 73 67 80" class="k-line"/>`,
    }[mood] || `<path d="M53 75 Q56.5 80 60 75 Q63.5 80 67 75" class="k-line"/>`;
    return `<svg class="kitsu-svg" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
      <ellipse cx="96" cy="99" rx="11" ry="7" fill="#f0c58e" stroke="#2b2230" stroke-width="3" transform="rotate(-25 96 99)"/>
      <path d="M103 93 q5 2 5 7 q-5 0 -7 -3z" fill="#2b2230"/>
      <ellipse cx="60" cy="102" rx="25" ry="14" fill="#f0c58e" stroke="#2b2230" stroke-width="3"/>
      <ellipse cx="60" cy="104" rx="13" ry="8" fill="#fff4e6"/>
      <path d="M24 46 L31 13 L52 34 Z" fill="#f0c58e" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/>
      <path d="M96 46 L89 13 L68 34 Z" fill="#f0c58e" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/>
      <path d="M31 13 L28 1 M89 13 L92 1" stroke="#2b2230" stroke-width="4" stroke-linecap="round"/>
      <path d="M31 38 L33 21 L45 33 Z" fill="#fff4e6"/><path d="M89 38 L87 21 L75 33 Z" fill="#fff4e6"/>
      <path d="M24 66 L9 86 L22 82 L16 94 L32 84 Z" fill="#fff4e6" stroke="#2b2230" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M96 66 L111 86 L98 82 L104 94 L88 84 Z" fill="#fff4e6" stroke="#2b2230" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="60" cy="62" rx="40" ry="33" fill="#f0c58e" stroke="#2b2230" stroke-width="3"/>
      <ellipse cx="60" cy="77" rx="17" ry="11" fill="#fff4e6"/>
      <g fill="#8a5a3c" opacity=".75"><ellipse cx="50" cy="38" rx="2.4" ry="1.8"/><ellipse cx="60" cy="35" rx="2.4" ry="1.8"/><ellipse cx="70" cy="38" rx="2.4" ry="1.8"/>
        <ellipse cx="28" cy="58" rx="2" ry="1.6"/><ellipse cx="92" cy="58" rx="2" ry="1.6"/><ellipse cx="25" cy="66" rx="1.8" ry="1.4"/><ellipse cx="95" cy="66" rx="1.8" ry="1.4"/></g>
      <path d="M44 72 L22 70 M44 76 L23 78 M76 72 L98 70 M76 76 L97 78" stroke="#2b2230" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>
      <g transform="translate(91 24)">${[0, 60, 120, 180, 240, 300].map(r => `<ellipse rx="4" ry="6.5" cy="-4.5" transform="rotate(${r})" fill="#e8433a"/>`).join("")}<circle r="3.4" fill="#c22d25"/><path d="M-2 6 q-2 6 -6 8" stroke="#3f8f5a" stroke-width="2" fill="none"/></g>
      <ellipse cx="33" cy="72" rx="6.5" ry="4" fill="#ff9d8a" opacity=".6"/><ellipse cx="87" cy="72" rx="6.5" ry="4" fill="#ff9d8a" opacity=".6"/>
      ${eyes}${mouth}
      <path d="M56.5 69 L63.5 69 L60 73 Z" fill="#e0707a" stroke="#2b2230" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>`;
  }
  function eye(cx, k = 1) {
    return `<ellipse cx="${cx}" cy="62" rx="${7 * k}" ry="${9.5 * k}" fill="#2b2230"/>
      <circle cx="${cx + 2.5 * k}" cy="${58 * 1 - 1 * k}" r="${2.8 * k}" fill="#fff"/><circle cx="${cx - 2.5 * k}" cy="${66}" r="${1.4 * k}" fill="#fff"/>`;
  }

  // ---- voice & sound ----
  function voice(line) {
    if (state.voice === false) return;
    TTS.speak(line.jp, { rate: 1.02, character: true });
  }
  let ctx;
  function tone(freq, start, dur, type = "sine", gain = 0.12) {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur);
  }
  function whoosh() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const len = ctx.sampleRate * 0.6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(400, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.5);
    g.gain.value = 0.18; src.connect(f).connect(g).connect(ctx.destination); src.start();
  }
  function sfx(kind) {
    if (state.sfx === false) return;
    try {
      if (kind === "right") { tone(880, 0, .12); tone(1318, .09, .18); }
      else if (kind === "combo") { tone(880, 0, .1); tone(1108, .08, .1); tone(1318, .16, .1); tone(1760, .24, .22); }
      else if (kind === "wrong") { tone(220, 0, .2, "triangle", .15); tone(185, .12, .25, "triangle", .15); }
      else if (kind === "finish") { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * .09, .25)); }
      else if (kind === "tap") tone(1200, 0, .06, "sine", .08);
      else if (kind === "whoosh") whoosh();
    } catch (_) { /* audio unavailable */ }
  }

  // ---- confetti (sakura petals) ----
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("canvas");
    c.className = "confetti"; document.body.append(c);
    const dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const g = c.getContext("2d"); g.scale(dpr, dpr);
    const colors = ["#ff7aa2", "#ffb3c8", "#ffd1dc", "#ffe08a", "#7a9cff", "#4fc3a1"];
    const ps = Array.from({ length: 90 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .35,
      vx: (Math.random() - .5) * 9, vy: -Math.random() * 9 - 3, r: Math.random() * 6 + 4,
      a: Math.random() * 6, va: (Math.random() - .5) * .3, c: colors[Math.floor(Math.random() * colors.length)],
    }));
    let t = 0;
    (function frame() {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of ps) {
        p.vy += .22; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c;
        g.beginPath(); g.ellipse(0, 0, p.r, p.r * .6, 0, 0, Math.PI * 2); g.fill(); g.restore();
      }
      if (++t < 110) requestAnimationFrame(frame); else c.remove();
    })();
  }

  // ---- UI pieces ----
  function bubbleHtml(line, mood, size = 72, cls = "") {
    return `<div class="kitsu-row ${cls}">
      <button class="kitsu" aria-label="Lía, your guide">${svg(mood, size)}</button>
      <div class="kitsu-bubble"><div class="kb-jp">${esc(line.jp)}</div><div class="kb-en">${esc(line.en)}</div></div>
    </div>`;
  }
  function greeting() {
    const h = new Date().getHours();
    const streak = currentStreak();
    if (dueItems().length >= 5) return { line: pick(LINES.due), mood: "wink" };
    if (streak >= 2) return { line: fill(pick(LINES.streak), streak), mood: "happy" };
    return { line: pick(h < 11 ? LINES.morning : h < 18 ? LINES.afternoon : LINES.evening), mood: "normal" };
  }
  let greeted = false;
  function homeCard() {
    const { line, mood } = greeting();
    if (!greeted) { greeted = true; setTimeout(() => voice(line), 300); }
    return bubbleHtml(line, mood, 84, "home-kitsu");
  }
  function bindTap(root = document) {
    root.querySelectorAll(".kitsu").forEach(k => k.onclick = () => {
      const line = pick(LINES.tips);
      const row = k.closest(".kitsu-row");
      k.innerHTML = svg(pick(["happy", "wink", "wow"]), k.querySelector("svg").getAttribute("width"));
      row.querySelector(".kb-jp").textContent = line.jp;
      row.querySelector(".kb-en").textContent = line.en;
      k.classList.remove("bounce"); void k.offsetWidth; k.classList.add("bounce");
      sfx("tap"); voice(line);
    });
  }
  // Reaction shown in a lesson's feedback box. Returns HTML.
  function react(ok, combo) {
    let line, mood;
    if (ok && combo >= 3 && combo % 3 === 0) { line = fill(pick(LINES.combo), combo); mood = "wow"; sfx("combo"); }
    else if (ok) { line = pick(LINES.right); mood = "happy"; sfx("right"); }
    else { line = pick(LINES.wrong); mood = "sad"; sfx("wrong"); }
    return `<div class="kitsu-mini ${ok ? "" : "shake"}">${svg(mood, 44)}<b>${esc(line.jp)}</b><span>${esc(line.en)}</span></div>`;
  }
  function finish(accuracy) {
    const line = pick(accuracy >= 90 ? LINES.finishGreat : accuracy >= 60 ? LINES.finish : LINES.finishLow);
    const mood = accuracy >= 90 ? "wow" : accuracy >= 60 ? "happy" : "wink";
    sfx("finish");
    if (accuracy >= 60) confetti();
    setTimeout(() => voice(line), 400);
    return bubbleHtml(line, mood, 120, "finish-kitsu");
  }
  return { svg, LINES, pick, homeCard, bindTap, react, finish, voice, sfx, confetti, bubbleHtml };
})();

// ---- Word of the day ----
function wordOfTheDay() {
  const words = Object.values(ALL_ITEMS).filter(i => i.type === "vocab");
  if (!words.length) return null;
  let h = 0; for (const ch of today()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return words[h % words.length];
}
