"use strict";
// Kitsu — the app's mascot: a chibi fox spirit who cheers you on.
// Also holds the little "juice": sound effects, confetti, word of the day.

const Mascot = (() => {
  const L = (jp, romaji, en) => ({ jp, romaji, en });
  const LINES = {
    morning: [L("おはよう！今日もがんばろう！", "ohayou! kyou mo ganbarou!", "Good morning! Let's do our best today!")],
    afternoon: [L("こんにちは！ちょっと勉強しない？", "konnichiwa! chotto benkyou shinai?", "Hi! How about a little study?")],
    evening: [L("こんばんは！寝る前に一つだけ！", "konbanwa! neru mae ni hitotsu dake!", "Good evening! Just one lesson before bed!")],
    streak: [L("連続{n}日！すごいね！", "renzoku {n} nichi! sugoi ne!", "{n} days in a row! Amazing!")],
    due: [L("復習カードが待ってるよ！", "fukushuu kaado ga matteru yo!", "Your review cards are waiting!")],
    right: [
      L("いいね！", "ii ne!", "Nice!"), L("すごい！", "sugoi!", "Amazing!"), L("その調子！", "sono choushi!", "Keep it up!"),
      L("完璧！", "kanpeki!", "Perfect!"), L("天才！", "tensai!", "Genius!"), L("正解！", "seikai!", "Correct!"),
    ],
    combo: [L("{n}連続！止まらない！", "{n} renzoku! tomaranai!", "{n} in a row! Unstoppable!")],
    wrong: [
      L("ドンマイ！", "donmai!", "Don't worry about it!"), L("おしい！", "oshii!", "So close!"),
      L("大丈夫、次はできるよ！", "daijoubu, tsugi wa dekiru yo!", "It's OK, you'll get the next one!"),
      L("間違いは成長のもと！", "machigai wa seichou no moto!", "Mistakes are how we grow!"),
    ],
    finishGreat: [L("やったね！最高！", "yatta ne! saikou!", "You did it! The best!")],
    finish: [L("お疲れさま！よくがんばったね！", "otsukaresama! yoku ganbatta ne!", "Great work! You tried hard!")],
    finishLow: [L("がんばったね！もう一回やってみよう！", "ganbatta ne! mou ikkai yatte miyou!", "Good effort! Let's try it again!")],
    tips: [
      L("日本では食べる前に「いただきます」って言うよ。", "nihon de wa taberu mae ni \"itadakimasu\" tte iu yo.", "In Japan, people say \"itadakimasu\" before eating."),
      L("「先輩」は学校や会社で先に入った人のことだよ。", "\"senpai\" wa gakkou ya kaisha de saki ni haitta hito no koto da yo.", "A \"senpai\" is someone who joined your school or company before you."),
      L("きつねは日本の神社の神様のお使いなんだ！", "kitsune wa nihon no jinja no kamisama no otsukai nan da!", "Foxes are messengers of the gods at Japanese shrines!"),
      L("毎日五分でも、続けることが大事だよ。", "mainichi gofun demo, tsuzukeru koto ga daiji da yo.", "Even five minutes a day — keeping it up is what matters."),
      L("アニメを日本語の字幕で見ると勉強になるよ！", "anime o nihongo no jimaku de miru to benkyou ni naru yo!", "Watching anime with Japanese subtitles is great practice!"),
      L("「お疲れさま」は仕事のあとによく使うよ。", "\"otsukaresama\" wa shigoto no ato ni yoku tsukau yo.", "People say \"otsukaresama\" a lot after work."),
      L("漢字は書くと覚えやすいよ。「書く」タブで練習しよう！", "kanji wa kaku to oboeyasui yo.", "Kanji stick better when you write them. Try the Write tab!"),
      L("日本語には「ありがとう」の言い方がたくさんあるよ。", "nihongo ni wa \"arigatou\" no iikata ga takusan aru yo.", "Japanese has many ways to say thank you."),
    ],
    placement: [L("あなたのレベルを調べよう！", "anata no reberu o shirabeyou!", "Let's find your level!")],
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
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
      <path d="M86 100 Q116 96 110 66 Q104 84 84 88 Z" fill="#fff" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/>
      <path d="M110 66 Q112 74 106 80 Q104 72 110 66Z" fill="#ff9dbb"/>
      <ellipse cx="60" cy="102" rx="25" ry="14" fill="#fff" stroke="#2b2230" stroke-width="3"/>
      <path d="M24 44 L32 6 L54 32 Z" fill="#fff" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/>
      <path d="M96 44 L88 6 L66 32 Z" fill="#fff" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/>
      <path d="M31 36 L34 16 L46 31 Z" fill="#ffc2d4"/><path d="M89 36 L86 16 L74 31 Z" fill="#ffc2d4"/>
      <ellipse cx="60" cy="62" rx="40" ry="33" fill="#fff" stroke="#2b2230" stroke-width="3"/>
      <path d="M40 34 Q50 40 47 30 M80 34 Q70 40 73 30" stroke="#ff9dbb" stroke-width="3" fill="none" stroke-linecap="round"/>
      <g transform="translate(90 18)">${[0, 72, 144, 216, 288].map(r => `<ellipse rx="4" ry="6" cy="-5" transform="rotate(${r})" fill="#ff8fb1"/>`).join("")}<circle r="2.6" fill="#ffe08a"/></g>
      <ellipse cx="33" cy="74" rx="7" ry="4.5" fill="#ff9dbb" opacity=".65"/><ellipse cx="87" cy="74" rx="7" ry="4.5" fill="#ff9dbb" opacity=".65"/>
      ${eyes}${mouth}
      <path d="M58 70 L62 70 L60 72.5 Z" fill="#2b2230"/>
    </svg>`;
  }
  function eye(cx, k = 1) {
    return `<ellipse cx="${cx}" cy="62" rx="${7 * k}" ry="${9.5 * k}" fill="#2b2230"/>
      <circle cx="${cx + 2.5 * k}" cy="${58 * 1 - 1 * k}" r="${2.8 * k}" fill="#fff"/><circle cx="${cx - 2.5 * k}" cy="${66}" r="${1.4 * k}" fill="#fff"/>`;
  }

  // ---- voice & sound ----
  function voice(line) {
    if (state.voice === false || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(line.jp);
    u.lang = "ja-JP"; u.rate = 1; u.pitch = 1.6;
    if (typeof jaVoice !== "undefined" && jaVoice) u.voice = jaVoice;
    speechSynthesis.speak(u);
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
  function sfx(kind) {
    if (state.sfx === false) return;
    try {
      if (kind === "right") { tone(880, 0, .12); tone(1318, .09, .18); }
      else if (kind === "combo") { tone(880, 0, .1); tone(1108, .08, .1); tone(1318, .16, .1); tone(1760, .24, .22); }
      else if (kind === "wrong") { tone(220, 0, .2, "triangle", .15); tone(185, .12, .25, "triangle", .15); }
      else if (kind === "finish") { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * .09, .25)); }
      else if (kind === "tap") tone(1200, 0, .06, "sine", .08);
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
      <button class="kitsu" aria-label="Kitsu, your guide">${svg(mood, size)}</button>
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
