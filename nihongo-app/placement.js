"use strict";
// Placement test: 3 questions per level, stops at the first level you don't pass (2/3).
const PLACEMENT = [
  ["A1", [
    { q: "What does こんにちは mean?", options: ["Hello", "Thank you", "Goodbye", "Sorry"], answer: "Hello" },
    { q: "わたし＿学生です。", options: ["は", "を", "に", "で"], answer: "は" },
    { q: "How do you read 水?", options: ["みず", "やま", "かわ", "ひ"], answer: "みず" },
  ]],
  ["A2", [
    { q: "ちょっと＿ください。(wait)", options: ["待って", "待ちて", "待んで", "待た"], answer: "待って" },
    { q: "日本に行った＿があります。", options: ["こと", "もの", "とき", "の"], answer: "こと" },
    { q: "雨が降った＿、行きません。", options: ["ら", "て", "り", "が"], answer: "ら" },
  ]],
  ["B1", [
    { q: "日本語が話せる＿になりました。", options: ["よう", "こと", "ため", "はず"], answer: "よう" },
    { q: "先生にほめ＿ました。(I was praised)", options: ["られ", "させ", "させられ", "て"], answer: "られ" },
    { q: "空が暗い。雨が降り＿だ。(looks like)", options: ["そう", "らしい", "よう", "はず"], answer: "そう" },
  ]],
  ["B2", [
    { q: "値段は高い＿、品質はとてもいい。", options: ["ものの", "ものだから", "ものなら", "もので"], answer: "ものの" },
    { q: "上司の頼みなので、断る＿にはいかない。", options: ["わけ", "こと", "もの", "ほど"], answer: "わけ" },
    { q: "大雨に＿、試合は行われた。", options: ["もかかわらず", "よって", "ついて", "とって"], answer: "もかかわらず" },
  ]],
  ["C1", [
    { q: "本日＿もちまして、営業を終了いたします。", options: ["を", "に", "で", "が"], answer: "を" },
    { q: "そんなことは言う＿もない。", options: ["まで", "ほど", "こと", "わけ"], answer: "まで" },
    { q: "彼は物事を大げさに言う＿がある。", options: ["きらい", "ばかり", "おそれ", "ところ"], answer: "きらい" },
  ]],
  ["C2", [
    { q: "社長は明日の会議に＿ますか。(respectful \"come\")", options: ["いらっしゃい", "参り", "伺い", "おり"], answer: "いらっしゃい" },
    { q: "資料を＿いたしました。(humble \"look at\")", options: ["拝見", "ご覧", "見物", "拝聴"], answer: "拝見" },
    { q: "「顔が広い」 means…", options: ["knows lots of people", "has a big face", "is very famous abroad", "is shameless"], answer: "knows lots of people" },
  ]],
];

function startPlacement() {
  document.body.classList.add("in-lesson");
  let li = 0, qi = 0, levelRight = 0, result = "A1";
  const step = () => {
    if (li >= PLACEMENT.length) return finish("C2");
    const [lvl, qs] = PLACEMENT[li], q = qs[qi];
    const n = li * 3 + qi;
    $view.innerHTML = `<div class="lesson">
      <div class="lesson-top"><button class="icon-btn" id="quit" aria-label="Quit">✕</button>
        <div class="progress"><div style="width:${n / 18 * 100}%"></div></div><span class="muted">${lvl}</span></div>
      <div class="prompt">${esc(q.q).replace("＿", '<span class="blank">＿＿</span>')}</div>
      <div class="choices one-col stagger">${shuffle(q.options).map(o => `<button class="choice" data-id="${esc(o)}">${esc(o)}</button>`).join("")}</div>
      <button class="chip-btn" id="dunno">I don't know</button>
      <div class="spacer"></div>
    </div>`;
    document.getElementById("quit").onclick = () => setTab("home");
    const answer = picked => {
      if (picked === q.answer) levelRight++;
      Mascot.sfx("tap");
      qi++;
      if (qi === 3) {
        if (levelRight < 2) return finish(lvl);
        result = PLACEMENT[li + 1]?.[0] || "C2";
        li++; qi = 0; levelRight = 0;
      }
      step();
    };
    $view.querySelectorAll(".choice").forEach(c => c.onclick = () => answer(c.dataset.id));
    document.getElementById("dunno").onclick = () => answer(null);
  };
  const finish = lvl => {
    state.level = lvl; state.placement = lvl; save();
    const info = LEVELS.find(l => l.id === lvl);
    Mascot.sfx("finish"); Mascot.confetti();
    const line = { jp: `あなたのレベルは${lvl}だよ！`, en: `Your level is ${lvl} (${info.name}, ≈ JLPT ${info.jlpt}). Let's start there!` };
    setTimeout(() => Mascot.voice(line), 400);
    $view.innerHTML = `<div class="lesson done">
      <h2>Your level: ${lvl}</h2>
      ${Mascot.bubbleHtml(line, "wow", 120, "finish-kitsu")}
      <p class="muted">${esc(info.desc)}. You can switch levels any time with the tabs at the top of Learn.</p>
      <div class="spacer"></div>
      <button class="btn" id="cont">Start learning</button>
    </div>`;
    document.getElementById("cont").onclick = () => setTab("home");
  };
  $view.innerHTML = `<div class="lesson done">
    <h2>Find your level</h2>
    ${Mascot.bubbleHtml(Mascot.LINES.placement[0], "happy", 110, "finish-kitsu")}
    <p>Up to 18 quick questions, from beginner to mastery. It stops when the questions get too hard, so don't worry about mistakes. Choose “I don't know” rather than guessing.</p>
    <div class="spacer"></div>
    <button class="btn" id="go">Start</button>
    <button class="btn secondary" id="back" style="margin-top:10px">Not now</button>
  </div>`;
  document.getElementById("go").onclick = step;
  document.getElementById("back").onclick = () => setTab("home");
}
