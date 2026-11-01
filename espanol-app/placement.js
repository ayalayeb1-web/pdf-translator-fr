"use strict";
// Placement test: 3 questions per level, stops at the first level you don't pass (2/3).
const PLACEMENT = [
  ["A1", [
    { q: "What does «¿Qué tal?» mean?", options: ["How's it going?", "What's that?", "How much?", "Where?"], answer: "How's it going?" },
    { q: "Yo ＿ estudiante.", options: ["soy", "eres", "es", "estoy"], answer: "soy" },
    { q: "¿Dónde ＿ el museo?", options: ["está", "es", "hay", "son"], answer: "está" },
  ]],
  ["A2", [
    { q: "Hoy ＿ comido paella. (I have eaten)", options: ["he", "ha", "hay", "había"], answer: "he" },
    { q: "Ayer ＿ al cine con mis amigos. (I went)", options: ["fui", "iba", "voy", "fue"], answer: "fui" },
    { q: "De pequeño, ＿ en un pueblo. (I used to live)", options: ["vivía", "viví", "vivo", "viviré"], answer: "vivía" },
  ]],
  ["B1", [
    { q: "Quiero que ＿ a mi fiesta. (you come)", options: ["vengas", "vienes", "vendrás", "venir"], answer: "vengas" },
    { q: "Cuando llegué, la película ya ＿ empezado.", options: ["había", "ha", "habría", "hubo"], answer: "había" },
    { q: "Este regalo es ＿ ti.", options: ["para", "por", "a", "de"], answer: "para" },
  ]],
  ["B2", [
    { q: "Si ＿ dinero, viajaría por todo el mundo.", options: ["tuviera", "tengo", "tendría", "tenga"], answer: "tuviera" },
    { q: "Aunque ＿ mañana, iremos a la playa. (even if it rains)", options: ["llueva", "llueve", "lloverá", "llovió"], answer: "llueva" },
    { q: "En cuanto ＿ a casa, te llamo.", options: ["llegue", "llego", "llegaré", "llegaba"], answer: "llegue" },
  ]],
  ["C1", [
    { q: "Si me ＿ avisado, habría venido.", options: ["hubieras", "habías", "habrías", "hayas"], answer: "hubieras" },
    { q: "«Meter la pata» means…", options: ["to put your foot in it", "to walk slowly", "to cook meat", "to dance badly"], answer: "to put your foot in it" },
    { q: "Llevo tres años ＿ español.", options: ["estudiando", "estudiar", "estudiado", "estudio"], answer: "estudiando" },
  ]],
  ["C2", [
    { q: "«Estar hasta las narices» means…", options: ["to be fed up", "to have a cold", "to be very curious", "to be very happy"], answer: "to be fed up" },
    { q: "«No hay mal que por bien no ＿.»", options: ["venga", "viene", "vendrá", "vino"], answer: "venga" },
    { q: "Which register fits a formal letter? «＿ señor García:»", options: ["Estimado", "Querido tío", "Hola", "Oye"], answer: "Estimado" },
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
    const line = { jp: `¡Tu nivel es ${lvl}!`, en: `Your level is ${lvl} (${info.name}, ${info.jlpt}). Let's start there!` };
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
