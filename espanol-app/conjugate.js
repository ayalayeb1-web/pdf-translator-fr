"use strict";
// Conjugate: a Spanish verb conjugation engine (regular rules + common irregulars)
// and a spaced-repetition drill. Castilian Spanish: all six persons, vosotros included.

const PERSONS = ["yo", "tú", "él / ella / usted", "nosotros", "vosotros", "ellos / ustedes"];
const PERSONS_SHORT = ["yo", "tú", "él", "nosotros", "vosotros", "ellos"];
const TENSES = [
  { id: "pres", name: "Presente", en: "present", level: "A1" },
  { id: "perf", name: "Pretérito perfecto", en: "have done", level: "A2" },
  { id: "indef", name: "Pretérito indefinido", en: "simple past", level: "A2" },
  { id: "imperf", name: "Imperfecto", en: "used to / was -ing", level: "A2" },
  { id: "fut", name: "Futuro", en: "will", level: "A2" },
  { id: "cond", name: "Condicional", en: "would", level: "B1" },
  { id: "subj", name: "Presente de subjuntivo", en: "present subjunctive", level: "B1" },
];

const VERBS = {
  // regular
  hablar: { en: "to speak" }, trabajar: { en: "to work" }, estudiar: { en: "to study" }, bailar: { en: "to dance" },
  comprar: { en: "to buy" }, escuchar: { en: "to listen" }, viajar: { en: "to travel" }, tomar: { en: "to take / drink" },
  comer: { en: "to eat" }, beber: { en: "to drink" }, aprender: { en: "to learn" }, correr: { en: "to run" },
  vender: { en: "to sell" }, vivir: { en: "to live" }, subir: { en: "to go up" }, decidir: { en: "to decide" },
  escribir: { en: "to write", part: "escrito" }, abrir: { en: "to open", part: "abierto" },
  // irregular
  ser: { en: "to be (identity)", irr: true, part: "sido",
    pres: "soy eres es somos sois son", indef: "fui fuiste fue fuimos fuisteis fueron",
    imperf: "era eras era éramos erais eran", subj: "sea seas sea seamos seáis sean" },
  estar: { en: "to be (state, place)", irr: true,
    pres: "estoy estás está estamos estáis están", indef: "estuve estuviste estuvo estuvimos estuvisteis estuvieron",
    subj: "esté estés esté estemos estéis estén" },
  ir: { en: "to go", irr: true, part: "ido",
    pres: "voy vas va vamos vais van", indef: "fui fuiste fue fuimos fuisteis fueron",
    imperf: "iba ibas iba íbamos ibais iban", subj: "vaya vayas vaya vayamos vayáis vayan" },
  tener: { en: "to have", irr: true, futStem: "tendr",
    pres: "tengo tienes tiene tenemos tenéis tienen", indef: "tuve tuviste tuvo tuvimos tuvisteis tuvieron" },
  hacer: { en: "to do / make", irr: true, futStem: "har", part: "hecho",
    pres: "hago haces hace hacemos hacéis hacen", indef: "hice hiciste hizo hicimos hicisteis hicieron" },
  poder: { en: "can / to be able", irr: true, futStem: "podr",
    pres: "puedo puedes puede podemos podéis pueden", indef: "pude pudiste pudo pudimos pudisteis pudieron",
    subj: "pueda puedas pueda podamos podáis puedan" },
  querer: { en: "to want / love", irr: true, futStem: "querr",
    pres: "quiero quieres quiere queremos queréis quieren", indef: "quise quisiste quiso quisimos quisisteis quisieron",
    subj: "quiera quieras quiera queramos queráis quieran" },
  decir: { en: "to say", irr: true, futStem: "dir", part: "dicho",
    pres: "digo dices dice decimos decís dicen", indef: "dije dijiste dijo dijimos dijisteis dijeron" },
  venir: { en: "to come", irr: true, futStem: "vendr",
    pres: "vengo vienes viene venimos venís vienen", indef: "vine viniste vino vinimos vinisteis vinieron" },
  saber: { en: "to know (facts)", irr: true, futStem: "sabr",
    pres: "sé sabes sabe sabemos sabéis saben", indef: "supe supiste supo supimos supisteis supieron",
    subj: "sepa sepas sepa sepamos sepáis sepan" },
  poner: { en: "to put", irr: true, futStem: "pondr", part: "puesto",
    pres: "pongo pones pone ponemos ponéis ponen", indef: "puse pusiste puso pusimos pusisteis pusieron" },
  salir: { en: "to go out", irr: true, futStem: "saldr", pres: "salgo sales sale salimos salís salen" },
  ver: { en: "to see", irr: true, part: "visto",
    pres: "veo ves ve vemos veis ven", indef: "vi viste vio vimos visteis vieron",
    imperf: "veía veías veía veíamos veíais veían", subj: "vea veas vea veamos veáis vean" },
  dar: { en: "to give", irr: true,
    pres: "doy das da damos dais dan", indef: "di diste dio dimos disteis dieron", subj: "dé des dé demos deis den" },
  pensar: { en: "to think", irr: true,
    pres: "pienso piensas piensa pensamos pensáis piensan", subj: "piense pienses piense pensemos penséis piensen" },
  dormir: { en: "to sleep", irr: true,
    pres: "duermo duermes duerme dormimos dormís duermen", indef: "dormí dormiste durmió dormimos dormisteis durmieron",
    subj: "duerma duermas duerma durmamos durmáis duerman" },
  pedir: { en: "to ask for / order", irr: true,
    pres: "pido pides pide pedimos pedís piden", indef: "pedí pediste pidió pedimos pedisteis pidieron",
    subj: "pida pidas pida pidamos pidáis pidan" },
  volver: { en: "to return", irr: true, part: "vuelto",
    pres: "vuelvo vuelves vuelve volvemos volvéis vuelven", subj: "vuelva vuelvas vuelva volvamos volváis vuelvan" },
  jugar: { en: "to play", irr: true,
    pres: "juego juegas juega jugamos jugáis juegan", indef: "jugué jugaste jugó jugamos jugasteis jugaron",
    subj: "juegue juegues juegue juguemos juguéis jueguen" },
};

const END = {
  pres: { ar: "o as a amos áis an", er: "o es e emos éis en", ir: "o es e imos ís en" },
  indef: { ar: "é aste ó amos asteis aron", er: "í iste ió imos isteis ieron", ir: "í iste ió imos isteis ieron" },
  imperf: { ar: "aba abas aba ábamos abais aban", er: "ía ías ía íamos íais ían", ir: "ía ías ía íamos íais ían" },
  subj: { ar: "e es e emos éis en", er: "a as a amos áis an", ir: "a as a amos áis an" },
};
const FUT = "é ás á emos éis án".split(" "), COND = "ía ías ía íamos íais ían".split(" ");
const HABER = "he has ha hemos habéis han".split(" ");

function regularForms(verb, tense) {
  const type = verb.slice(-2), stem = verb.slice(0, -2);
  if (END[tense]) return END[tense][type].split(" ").map(e => stem + e);
  return null;
}
// All six forms of a verb in a tense.
function conjugate(verb, tense) {
  const v = VERBS[verb] || {};
  if (v[tense]) return v[tense].split(" ");
  if (tense === "fut") return FUT.map(e => (v.futStem || verb) + e);
  if (tense === "cond") return COND.map(e => (v.futStem || verb) + e);
  if (tense === "perf") {
    const part = v.part || verb.slice(0, -2) + (verb.endsWith("ar") ? "ado" : "ido");
    return HABER.map(h => `${h} ${part}`);
  }
  if (tense === "subj" && v.pres) {
    const yo = v.pres.split(" ")[0], stem = yo.replace(/o$/, ""), type = verb.slice(-2);
    return END.subj[type].split(" ").map(e => stem + e);
  }
  return regularForms(verb, tense);
}
// Is this form different from what the regular rule would give?
function isIrregularForm(verb, tense, i) {
  const reg = tense === "fut" || tense === "cond" ? (tense === "fut" ? FUT : COND).map(e => verb + e)
    : tense === "perf" ? HABER.map(h => `${h} ${verb.slice(0, -2)}${verb.endsWith("ar") ? "ado" : "ido"}`)
    : regularForms(verb, tense);
  return reg && reg[i] !== conjugate(verb, tense)[i];
}

// ---------- drill state ----------
state.conj = state.conj || {};
state.conjCfg = state.conjCfg || { tenses: ["pres"], set: "mix", mode: "type" };
const CONJ_INTERVALS = [0, 1, 2, 4, 8, 16];

function conjPool() {
  const cfg = state.conjCfg;
  const verbs = Object.keys(VERBS).filter(v => cfg.set === "reg" ? !VERBS[v].irr : cfg.set === "irr" ? VERBS[v].irr : true);
  const out = [];
  for (const t of cfg.tenses) for (const v of verbs) for (let i = 0; i < 6; i++) out.push({ verb: v, tense: t, i, key: `${v}|${t}|${i}` });
  return out;
}
function pickDrill(n = 12) {
  const now = Date.now(), pool = conjPool();
  const due = pool.filter(q => state.conj[q.key] && state.conj[q.key].due <= now);
  const fresh = pool.filter(q => !state.conj[q.key]);
  const picked = [...shuffle(due).slice(0, Math.ceil(n / 2)), ...shuffle(fresh)];
  const rest = shuffle(pool.filter(q => !picked.includes(q)));
  return [...picked, ...rest].slice(0, n);
}
function gradeConj(key, ok, accentOnly) {
  const c = state.conj[key] || { box: 0 };
  c.box = ok && !accentOnly ? Math.min(CONJ_INTERVALS.length - 1, c.box + 1) : ok ? c.box : 0;
  c.due = Date.now() + CONJ_INTERVALS[c.box] * DAY;
  state.conj[key] = c;
}

// ---------- view ----------
let conjTableVerb = "ser";
function renderConjugate() {
  const cfg = state.conjCfg;
  const mastered = Object.values(state.conj).filter(c => c.box >= 3).length;
  const due = conjPool().filter(q => state.conj[q.key]?.due <= Date.now()).length;
  $view.innerHTML = `
    <h2>Verbs</h2>
    ${Mascot.bubbleHtml({ jp: "¡Los verbos son la clave!", en: "Verbs are the key to Spanish! Pick tenses, then drill. Forms you miss come back sooner." }, "happy", 64)}
    <div class="card conj-setup">
      <b>Tenses</b>
      <div class="chip-row">${TENSES.map(t => `<button class="tchip ${cfg.tenses.includes(t.id) ? "on" : ""}" data-t="${t.id}"><b>${t.name}</b><small>${t.en} · ${t.level}</small></button>`).join("")}</div>
      <b style="display:block;margin-top:12px">Verbs</b>
      <div class="seg-row">${[["mix", "All verbs"], ["reg", "Regular"], ["irr", "Irregular"]].map(([k, l]) => `<button class="chip-btn ${cfg.set === k ? "active" : ""}" data-set="${k}">${l}</button>`).join("")}</div>
      <b style="display:block;margin-top:12px">Answer by</b>
      <div class="seg-row">${[["type", "⌨️ Typing"], ["choice", "👆 Choosing"]].map(([k, l]) => `<button class="chip-btn ${cfg.mode === k ? "active" : ""}" data-mode="${k}">${l}</button>`).join("")}</div>
      <button class="btn" id="startDrill" style="margin-top:14px">🔥 Start drill (12)</button>
      <p class="muted" style="margin:8px 0 0;font-size:.85rem">${mastered} forms mastered${due ? ` · ${due} due for review` : ""}</p>
    </div>
    <h3 class="gym-h">Verb tables <small class="muted">tap a form to hear it · <span class="irr-dot"></span> irregular</small></h3>
    <div class="verb-pick">${Object.keys(VERBS).map(v => `<button class="vpill ${v === conjTableVerb ? "on" : ""} ${VERBS[v].irr ? "irr" : ""}" data-v="${v}">${v}</button>`).join("")}</div>
    <div id="vtable"></div>`;
  Mascot.bindTap($view);
  $view.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
    const t = b.dataset.t, on = cfg.tenses.includes(t);
    if (on && cfg.tenses.length === 1) return toast("Keep at least one tense");
    cfg.tenses = on ? cfg.tenses.filter(x => x !== t) : [...cfg.tenses, t];
    save(); b.classList.toggle("on", !on);
  });
  $view.querySelectorAll("[data-set]").forEach(b => b.onclick = () => { cfg.set = b.dataset.set; save(); renderConjugate(); });
  $view.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { cfg.mode = b.dataset.mode; save(); renderConjugate(); });
  $view.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { conjTableVerb = b.dataset.v; renderConjugate(); document.getElementById("vtable").scrollIntoView({ behavior: "smooth", block: "nearest" }); });
  document.getElementById("startDrill").onclick = () => conjDrill(pickDrill(12));
  drawVerbTable(document.getElementById("vtable"), conjTableVerb);
}
VIEWS.chart = renderConjugate;

function drawVerbTable(box, verb) {
  box.innerHTML = `<div class="card vtable-card">
    <div class="vt-head"><b class="vt-verb">${verb}</b><span class="muted">${esc(VERBS[verb].en)}</span><button class="speak small" id="vtSay" aria-label="Play">🔊</button></div>
    <div class="vt-scroll"><table class="vt">
      <thead><tr><th></th>${TENSES.map(t => `<th>${t.name}</th>`).join("")}</tr></thead>
      <tbody>${PERSONS_SHORT.map((p, i) => `<tr><th>${p}</th>${TENSES.map(t => {
        const f = conjugate(verb, t.id)[i];
        return `<td><button class="vt-form ${isIrregularForm(verb, t.id, i) ? "irr" : ""}" data-f="${esc(f)}">${esc(f)}</button></td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table></div></div>`;
  box.querySelector("#vtSay").onclick = () => TTS.speak(verb);
  box.querySelectorAll(".vt-form").forEach(b => b.onclick = () => TTS.speak(b.dataset.f));
}

// ---------- drill ----------
function conjDrill(qs) {
  document.body.classList.add("in-lesson");
  let k = 0, right = 0, combo = 0;
  const next = () => {
    if (k >= qs.length) return finish();
    const q = qs[k], tense = TENSES.find(t => t.id === q.tense), answer = conjugate(q.verb, q.tense)[q.i];
    const choice = state.conjCfg.mode === "choice";
    let options = [];
    if (choice) {
      const pool = new Set();
      conjugate(q.verb, q.tense).forEach(f => pool.add(f));
      TENSES.forEach(t => pool.add(conjugate(q.verb, t.id)[q.i]));
      pool.delete(answer);
      options = shuffle([answer, ...shuffle([...pool]).slice(0, 3)]);
    }
    swapView(() => {
      $view.innerHTML = `<div class="lesson">
        <div class="lesson-top"><button class="icon-btn" id="quit" aria-label="Quit">✕</button>
          <div class="progress"><div style="width:${k / qs.length * 100}%"></div></div>${combo >= 2 ? `<span class="combo">🔥${combo}</span>` : ""}</div>
        <div class="conj-q">
          <div class="cq-tense">${tense.name} <small>${tense.en}</small></div>
          <div class="cq-verb">${q.verb} <small>${esc(VERBS[q.verb].en)}</small></div>
          <div class="cq-person">${PERSONS[q.i]}</div>
        </div>
        ${choice ? `<div class="choices stagger">${options.map(o => `<button class="choice" data-id="${esc(o)}">${esc(o)}</button>`).join("")}</div>`
          : `<input class="type-input conj-input" id="cAns" autocomplete="off" autocapitalize="off" spellcheck="false" lang="es" placeholder="${PERSONS_SHORT[q.i]}…">
             <div class="accent-keys">${["á", "é", "í", "ó", "ú", "ñ"].map(c => `<button class="akey" data-c="${c}">${c}</button>`).join("")}</div>`}
        <div class="spacer"></div><div id="cfb"></div>
        <button class="btn" id="cGo" disabled>Check</button></div>`;
      document.getElementById("quit").onclick = () => setTab("chart");
      const go = document.getElementById("cGo"), input = document.getElementById("cAns");
      let sel = null, done = false;
      if (input) {
        input.focus();
        input.oninput = () => {
          go.disabled = !input.value.trim();
          if (autoCheckOn() && !done && input.value.trim().toLowerCase().replace(/\s+/g, " ") === answer) go.click();
        };
        input.onkeydown = e => { if (e.key === "Enter" && !go.disabled) go.click(); };
        $view.querySelectorAll(".akey").forEach(kb => kb.onclick = () => {
          const pos = input.selectionStart ?? input.value.length;
          input.value = input.value.slice(0, pos) + kb.dataset.c + input.value.slice(pos);
          input.focus(); input.setSelectionRange(pos + 1, pos + 1); go.disabled = false;
        });
      }
      $view.querySelectorAll(".choice").forEach(c => c.onclick = () => {
        if (done) return; $view.querySelectorAll(".choice").forEach(x => x.classList.remove("selected"));
        c.classList.add("selected"); sel = c.dataset.id; go.disabled = false;
        if (autoCheckOn()) go.click();
      });
      go.onclick = () => {
        if (done) { k++; return next(); }
        done = true;
        const given = (choice ? sel : input.value).trim().toLowerCase().replace(/\s+/g, " ");
        const exact = given === answer, loose = foldEs(given) === foldEs(answer);
        const ok = exact || loose, accentOnly = !exact && loose;
        gradeConj(q.key, ok, accentOnly); save();
        if (ok) { right++; combo++; } else combo = 0;
        $view.querySelectorAll(".choice").forEach(c => { if (c.dataset.id === answer) c.classList.add("right"); else if (c.dataset.id === sel) c.classList.add("wrong"); });
        if (input) input.classList.add(ok ? "good" : "bad");
        const row = conjugate(q.verb, q.tense);
        document.getElementById("cfb").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}">${Mascot.react(ok, combo)}
          <div style="font-weight:400">${ok ? (accentOnly ? `Almost perfect, but watch the accent: <b>${esc(answer)}</b>` : "") : `Correct answer: <b>${esc(answer)}</b>`}</div>
          <div class="mini-table">${row.map((f, i) => `<span class="${i === q.i ? "hl" : ""}"><small>${PERSONS_SHORT[i]}</small>${esc(f)}</span>`).join("")}</div></div>`;
        TTS.speak(`${PERSONS_SHORT[q.i] === "él" ? "él" : PERSONS_SHORT[q.i]} ${answer}`, { rate: 0.9 });
        go.textContent = "Continue"; go.disabled = false;
        autoAdvance(go, ok, () => go.click());
      };
    });
  };
  const finish = () => {
    const pct = Math.round(100 * right / qs.length);
    addXp(6 + right);
    logActivity("drill", { accuracy: pct, bestCombo: combo });
    swapView(() => {
      $view.innerHTML = `<div class="lesson done"><h2>Drill complete!</h2>${Mascot.finish(pct)}
        <div class="done-stats"><div class="card"><b>${right}/${qs.length}</b>correct</div><div class="card"><b>${pct}%</b>accuracy</div><div class="card"><b>+${6 + right}</b>XP</div></div>
        <div class="spacer"></div><button class="btn" id="again">Another drill</button><button class="btn secondary" id="back" style="margin-top:10px">Back</button></div>`;
      Mascot.bindTap($view);
      document.getElementById("again").onclick = () => conjDrill(pickDrill(12));
      document.getElementById("back").onclick = () => setTab("chart");
    });
  };
  next();
}
