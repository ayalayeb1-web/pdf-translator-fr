"use strict";
// The Learn tab: a journey map across Spain. Each level is a region with its own
// scenery and ambient particles. Lía (the mascot) sits on your current lesson and
// flies along the road when you finish one.

const REGIONS = {
  A1: { name: "Madrid", jp: "La capital", kanji: "M", ambient: "sparkles", color: "#ffd36e", props: ["edificio", "farola", "arbol", "edificio", "farola"] },
  A2: { name: "Sevilla", jp: "Naranjos y flamenco", kanji: "S", ambient: "petals", color: "#ffffff", props: ["naranjo", "giralda", "abanico", "naranjo", "naranjo"] },
  B1: { name: "Barcelona", jp: "Gaudí y el mar", kanji: "B", ambient: "sparkles", color: "#9fd8ff", props: ["mosaico", "sagrada", "ola", "palmera", "ola"] },
  B2: { name: "Granada", jp: "La Alhambra", kanji: "G", ambient: "fireflies", color: "#ffe27a", props: ["arco", "cipres", "granada", "sierra", "cipres"] },
  C1: { name: "Salamanca", jp: "Ciudad dorada", kanji: "S", ambient: "leaves", color: "#e8a23c", props: ["universidad", "libros", "rana", "arbol", "libros"] },
  C2: { name: "Camino de Santiago", jp: "Galicia verde", kanji: "C", ambient: "rain", color: "#bcd7ff", props: ["vieira", "horreo", "pino", "colina", "nube"] },
};
const REDUCE = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const SVGNS = "http://www.w3.org/2000/svg";

// ---------- scenery props (drawn at origin, base at y=0) ----------
const PROP = {
  edificio: () => `<rect x="-16" y="-54" width="32" height="54" rx="2" fill="#f2d9b5"/><rect x="-18" y="-58" width="36" height="5" fill="#c9734a"/>${[0, 1, 2].map(r => [0, 1].map(c => `<rect x="${-11 + c * 14}" y="${-48 + r * 15}" width="8" height="10" fill="#5b4c86"/><path d="M${-13 + c * 14} ${-37 + r * 15} h12" stroke="#2f2747" stroke-width="2"/>`).join("")).join("")}<rect x="-3" y="-12" width="6" height="12" fill="#8a5a44"/>`,
  farola: () => `<rect x="-1.5" y="-46" width="3" height="46" fill="#2f2747"/><path d="M-7 -46 h14 l-3 -8 h-8z" fill="#2f2747"/><circle cx="0" cy="-49" r="9" fill="#ffd36e" opacity=".3"/><rect x="-4" y="-52" width="8" height="5" fill="#ffe28a"/>`,
  arbol: () => `<path d="M0 0 V-18" stroke="#7a5236" stroke-width="5" stroke-linecap="round"/><g fill="#5fae6e"><circle cx="-9" cy="-26" r="11"/><circle cx="8" cy="-30" r="12"/><circle cx="0" cy="-38" r="10"/></g><circle cx="4" cy="-34" r="4" fill="#7cc488" opacity=".7"/>`,
  naranjo: () => `<path d="M0 0 V-16" stroke="#7a5236" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-30" r="17" fill="#3f9a5a"/>${[[-8, -34], [6, -38], [9, -24], [-5, -22], [1, -30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#ff9a1f"/>`).join("")}`,
  giralda: () => `<rect x="-9" y="-62" width="18" height="62" fill="#e7b97c"/><rect x="-6" y="-76" width="12" height="14" fill="#f0cf9a"/><path d="M-4 -76 L0 -86 L4 -76Z" fill="#c9734a"/>${[0, 1, 2, 3].map(r => `<rect x="-3" y="${-56 + r * 13}" width="6" height="7" rx="3" fill="#a5643a"/>`).join("")}`,
  abanico: () => `<path d="M0 0 L-24 -20 A31 31 0 0 1 24 -20 Z" fill="#e8433a"/>${[-18, -9, 0, 9, 18].map(x => `<path d="M0 0 L${x} -28" stroke="#b02a22" stroke-width="1.5"/>`).join("")}<path d="M-24 -20 A31 31 0 0 1 24 -20" stroke="#ffd36e" stroke-width="2.5" fill="none"/><circle r="2.5" fill="#2f2747"/>`,
  mosaico: () => `<circle cx="0" cy="-20" r="18" fill="#f3efe6"/>${[["#2f5be0", -8, -26], ["#f6a609", 6, -30], ["#e8433a", 9, -16], ["#14a37f", -6, -12], ["#8b5cf6", 0, -21]].map(([c, x, y]) => `<path d="M${x - 5} ${y} l5 -5 l5 4 l-3 6z" fill="${c}"/>`).join("")}<circle cx="0" cy="-20" r="18" fill="none" stroke="#c9734a" stroke-width="2"/>`,
  sagrada: () => [-14, -5, 5, 14].map((x, i) => `<path d="M${x - 4} 0 L${x} ${-50 - (i % 3) * 10} L${x + 4} 0Z" fill="#d6b48a"/>${[1, 2, 3].map(k => `<circle cx="${x}" cy="${-k * 12}" r="1.4" fill="#8a5a44"/>`).join("")}`).join("") + `<circle cx="-5" cy="-62" r="2.5" fill="#e8433a"/><circle cx="5" cy="-52" r="2.5" fill="#f6a609"/>`,
  ola: () => `<path d="M-28 0 q7 -11 14 0 t14 0 t14 0 t14 0" stroke="#2f8fd8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-21 9 q6 -8 12 0 t12 0 t12 0" stroke="#8cc6f0" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  palmera: () => `<path d="M0 0 Q4 -24 -2 -46" stroke="#8a5a36" stroke-width="5" fill="none" stroke-linecap="round"/>${[-40, -10, 20, 150, 180, 210].map(a => `<path d="M-2 -46 q${Math.cos(a * Math.PI / 180) * 14} ${Math.sin(a * Math.PI / 180) * 6 - 6} ${Math.cos(a * Math.PI / 180) * 24} ${Math.sin(a * Math.PI / 180) * 12 + 4}" stroke="#3f9a5a" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")}`,
  arco: () => `<rect x="-24" y="-40" width="48" height="40" fill="#e9c9a0"/>${[-12, 12].map(x => `<path d="M${x - 8} 0 V-18 a8 9 0 0 1 16 0 V0Z" fill="#7a4a36"/><path d="M${x - 9} -18 a9 10 0 0 1 18 0" stroke="#c9734a" stroke-width="2.5" fill="none"/>`).join("")}<rect x="-26" y="-44" width="52" height="5" fill="#c9734a"/>`,
  cipres: () => `<path d="M0 0 V-6" stroke="#6b4a36" stroke-width="4"/><ellipse cx="0" cy="-30" rx="7" ry="26" fill="#2f7a4f"/><ellipse cx="-2" cy="-34" rx="3" ry="16" fill="#3f9a62" opacity=".7"/>`,
  granada: () => `<circle cx="0" cy="-14" r="13" fill="#d8344a"/><path d="M-5 -26 l2 -6 l3 4 l3 -4 l2 6z" fill="#b8293b"/><circle cx="-4" cy="-17" r="3" fill="#ff7a8a" opacity=".6"/>`,
  sierra: () => `<path d="M-38 0 L-6 -44 L10 -24 L22 -36 L40 0Z" fill="#8790cc"/><path d="M-14 -33 L-6 -44 L2 -33 L-3 -30 L-6 -34 L-10 -30Z" fill="#fff"/><path d="M17 -30 L22 -36 L27 -30Z" fill="#fff"/>`,
  universidad: () => `<rect x="-24" y="-46" width="48" height="46" fill="#e8b866"/><path d="M-26 -46 L0 -60 L26 -46Z" fill="#c98a3a"/><path d="M-7 0 V-16 a7 8 0 0 1 14 0 V0Z" fill="#7a4a36"/>${[-17, 17].map(x => `<rect x="${x - 3}" y="-38" width="6" height="12" rx="3" fill="#a5643a"/>`).join("")}<circle cx="0" cy="-30" r="3" fill="#a5643a"/>`,
  libros: () => `<rect x="-16" y="-8" width="32" height="8" rx="1.5" fill="#2f5be0"/><rect x="-13" y="-16" width="28" height="8" rx="1.5" fill="#e8433a"/><rect x="-15" y="-24" width="26" height="8" rx="1.5" fill="#14a37f"/><path d="M-10 -20 h18 M-12 -4 h22" stroke="#fff" stroke-width="1" opacity=".6"/>`,
  rana: () => `<ellipse cx="0" cy="-8" rx="13" ry="9" fill="#6cc06a"/><circle cx="-6" cy="-17" r="5" fill="#6cc06a"/><circle cx="6" cy="-17" r="5" fill="#6cc06a"/><circle cx="-6" cy="-17" r="2.2" fill="#2f2747"/><circle cx="6" cy="-17" r="2.2" fill="#2f2747"/><path d="M-5 -6 q5 4 10 0" stroke="#2f2747" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="-9" cy="-6" rx="2.5" ry="1.6" fill="#ff9d8a" opacity=".7"/><ellipse cx="9" cy="-6" rx="2.5" ry="1.6" fill="#ff9d8a" opacity=".7"/>`,
  vieira: () => `<path d="M0 -2 L-18 -22 A24 24 0 0 1 18 -22 Z" fill="#f6c444"/>${[-12, -6, 0, 6, 12].map(x => `<path d="M0 -2 L${x} -30" stroke="#d99a1f" stroke-width="1.8"/>`).join("")}<path d="M-6 -2 h12 l-2 4 h-8z" fill="#d99a1f"/>`,
  horreo: () => `<rect x="-3" y="-14" width="5" height="14" fill="#8d8a86"/><rect x="14" y="-14" width="5" height="14" fill="#8d8a86"/><rect x="-22" y="-14" width="5" height="14" fill="#8d8a86"/><rect x="-24" y="-34" width="46" height="20" fill="#b7aea4"/>${[-16, -8, 0, 8, 16].map(x => `<rect x="${x - 1}" y="-31" width="2" height="14" fill="#8d8a86"/>`).join("")}<path d="M-28 -34 L-1 -44 L26 -34Z" fill="#c9734a"/><path d="M-1 -44 v-8 M-5 -49 h8" stroke="#8d8a86" stroke-width="2"/>`,
  pino: () => `<path d="M0 0 V-8" stroke="#6b4a36" stroke-width="4"/><path d="M-13 -8 L0 -38 L13 -8Z" fill="#2f7a4f"/><path d="M-9 -20 L0 -46 L9 -20Z" fill="#3f9a62"/>`,
  colina: () => `<path d="M-40 0 Q-20 -30 0 -18 Q18 -36 40 0Z" fill="#6cbf6a"/><path d="M-30 -6 Q-18 -22 -6 -14" stroke="#8ad48a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  nube: () => `<g fill="#fff" opacity=".9"><ellipse cx="0" cy="-12" rx="24" ry="10"/><ellipse cx="-12" cy="-17" rx="12" ry="9"/><ellipse cx="10" cy="-21" rx="14" ry="11"/></g>`,
};

// ---------- geometry ----------
function mapLayout(level, width) {
  const nodes = [], signs = [];
  const cx = width / 2, amp = Math.min(120, width * 0.27);
  let y = 30, k = 0;
  level.units.forEach((unit, u) => {
    y += u ? 54 : 0;
    signs.push({ unit, u, y });
    y += 124;
    unit.lessons.forEach((lesson, i) => {
      nodes.push({ lesson, unit, u, i, x: cx + amp * Math.sin(k * 0.85 + 0.6), y });
      k++; y += 116;
    });
  });
  signs.forEach(sg => {
    const next = nodes.find(n => n.y > sg.y) || nodes[nodes.length - 1];
    sg.left = next.x > cx;
  });
  return { nodes, signs, height: y + 20, cx, amp };
}

// Smooth Catmull-Rom curve through points, drawing only segments [from, to].
function curve(pts, from = 0, to = pts.length - 1) {
  if (to <= from) return pts[from] ? `M${pts[from].x},${pts[from].y}` : "";
  let d = `M${pts[from].x},${pts[from].y}`;
  for (let i = from; i < to; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}

function seeded(seed) {
  let h = 2166136261; for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

function propsSvg(level, layout, width) {
  const R = REGIONS[level.id], rnd = seeded(level.id);
  let out = "";
  for (let y = 120; y < layout.height - 40; y += 70 + rnd() * 60) {
    const near = layout.nodes.reduce((a, n) => (Math.abs(n.y - y) < Math.abs(a.y - y) ? n : a), layout.nodes[0]);
    const left = near.x > layout.cx;
    const x = left ? 18 + rnd() * Math.max(10, near.x - 110) : near.x + 80 + rnd() * Math.max(10, width - near.x - 110);
    if (Math.abs(x - near.x) < 70 && Math.abs(y - near.y) < 60) continue;
    const kind = R.props[Math.floor(rnd() * R.props.length)];
    const s = 0.75 + rnd() * 0.5;
    out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})" class="prop">${PROP[kind]()}</g>`;
  }
  return out;
}

const FACE = { grammar: () => "¿?", vocab: () => "Aa", reading: () => "Lee" };
const TYPE_LABEL = { kana: "Kana", kanji: "Kanji", grammar: "Grammar", vocab: "Vocabulary", reading: "Reading" };

function currentNodeIndex(nodes) {
  const i = nodes.findIndex(n => !state.completed[n.lesson.id] && isUnlocked(n.unit, n.i));
  return i < 0 ? nodes.length - 1 : i;
}

// ---------- ambient particles ----------
let ambient = null;
function stopAmbient() { if (ambient) { cancelAnimationFrame(ambient.raf); ambient.c.remove(); ambient = null; } }
function startAmbient(kind) {
  stopAmbient();
  if (REDUCE()) return;
  const c = document.createElement("canvas");
  c.className = "ambient"; document.body.append(c);
  const g = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  const N = kind === "fireflies" ? 14 : kind === "sparkles" ? 16 : kind === "rain" ? 40 : 18;
  const ps = Array.from({ length: N }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: Math.random() * 0.6 + 0.5, a: Math.random() * 6.28, t: Math.random() * 100 }));
  const colors = { petals: "#ffffff", leaves: "#e8a23c", snow: "#ffffff", fireflies: "#ffe27a", sparkles: "#ffd36e", rain: "#9cc4ff" };
  const tint = REGIONS[currentLevel().id]?.color;
  if (tint) colors[kind] = tint;
  ambient = { c, raf: 0 };
  const step = () => {
    if (c.width !== Math.round(innerWidth * dpr)) size();
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.t += 0.016;
      if (kind === "fireflies" || kind === "sparkles") {
        p.x += Math.sin(p.t * 0.7 + p.a) * 0.4; p.y += Math.cos(p.t * 0.5 + p.a) * 0.3 - (kind === "sparkles" ? 0.15 : 0);
        const glow = (Math.sin(p.t * 2 + p.a) + 1) / 2;
        g.globalAlpha = 0.25 + glow * 0.55; g.fillStyle = colors[kind];
        g.beginPath(); g.arc(p.x, p.y, 2.2 * p.s + glow * 1.5, 0, 6.28); g.fill();
        g.globalAlpha = glow * 0.15; g.beginPath(); g.arc(p.x, p.y, 9 * p.s, 0, 6.28); g.fill();
      } else if (kind === "rain") {
        p.y += 7 * p.s; p.x -= 1;
        g.globalAlpha = 0.45; g.strokeStyle = colors.rain; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 2, p.y + 10); g.stroke();
      } else {
        p.y += (kind === "snow" ? 0.6 : 0.8) * p.s; p.x += Math.sin(p.t + p.a) * 0.6; p.a += 0.01;
        g.globalAlpha = kind === "snow" ? 0.8 : 0.7; g.fillStyle = colors[kind];
        g.save(); g.translate(p.x, p.y); g.rotate(p.a);
        g.beginPath();
        if (kind === "snow") g.arc(0, 0, 2.4 * p.s, 0, 6.28); else g.ellipse(0, 0, 5 * p.s, 3 * p.s, 0, 0, 6.28);
        g.fill(); g.restore();
      }
      if (p.y > innerHeight + 10) { p.y = -10; p.x = Math.random() * innerWidth; }
      if (p.y < -12) p.y = innerHeight + 8;
      if (p.x < -12) p.x = innerWidth + 8; if (p.x > innerWidth + 12) p.x = -8;
    }
    g.globalAlpha = 1;
    ambient.raf = requestAnimationFrame(step);
  };
  step();
}

// ---------- the Learn view ----------
let firstJourneyRender = true;
function renderJourney() {
  const level = currentLevel(), R = REGIONS[level.id];
  const all = lessonsOf(level), done = all.filter(l => state.completed[l.id]).length;
  const pct = all.length ? done / all.length : 0;
  const width = Math.max(300, Math.min(608, $view.clientWidth - 32));
  const layout = mapLayout(level, width);
  const cur = currentNodeIndex(layout.nodes);
  const wotd = wordOfTheDay();
  const nothingDone = !Object.keys(state.completed).length;
  const due = dueItems().length;
  const ring = 2 * Math.PI * 26;

  $view.innerHTML = `
    <div class="regions" id="regions" role="tablist" aria-label="Levels">${LEVELS.map(l => `
      <button class="region-card region-${l.id} ${l.id === level.id ? "active" : ""}" data-level="${l.id}" role="tab" aria-selected="${l.id === level.id}">
        <span class="rc-kanji">${REGIONS[l.id].kanji}</span><span class="rc-code">${l.id}</span><span class="rc-name">${REGIONS[l.id].name}</span>
      </button>`).join("")}
    </div>
    <section class="hero region-${level.id}">
      <div class="hero-kanji" aria-hidden="true">${R.kanji}</div>
      <div class="hero-text">
        <div class="eyebrow">${level.id} · ${level.jlpt} · ${esc(level.name)}</div>
        <h1 class="hero-title">${R.name}</h1>
        <div class="hero-jp">${R.jp}</div>
      </div>
      <div class="ring" title="${done} of ${all.length} lessons">
        <svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="26" class="ring-bg"/>
          <circle cx="32" cy="32" r="26" class="ring-fg" stroke-dasharray="${ring}" stroke-dashoffset="${ring * (1 - pct)}"/></svg>
        <b>${Math.round(pct * 100)}%</b>
      </div>
    </section>
    ${Mascot.homeCard()}
    ${dailyPlanHtml()}
    <div class="tools-row stagger">
      ${!state.placement && nothingDone ? `<button class="tool-chip hot" id="placeBtn">🎯 Find my level</button>` : ""}
      ${due ? `<button class="tool-chip" id="dueBtn">🔁 ${due} to review</button>` : ""}
      ${wotd ? `<button class="tool-chip" id="wotdBtn"><b>${esc(wotd.jp)}</b> word of the day</button>` : ""}
      ${videoLink(`aprender español de España nivel ${level.id}`, `${level.id} videos`).replace('class="video-link"', 'class="tool-chip"')}
      ${videoLink(`learn Spanish with Spanish series ${level.id}`, "Spanish series").replace('class="video-link"', 'class="tool-chip"')}
      ${state.placement || !nothingDone ? `<button class="tool-chip" id="placeBtn">🎯 Level test</button>` : ""}
    </div>
    ${level.ai ? `<p class="ai-note">✨ Lessons in ${R.name} are written for you by AI the first time you open them, then saved on this device.</p>` : ""}
    <div class="map region-${level.id}" id="map" style="height:${layout.height}px">
      <div class="map-far" id="mapFar" aria-hidden="true"></div>
      <svg class="map-svg" width="${width}" height="${layout.height}" viewBox="0 0 ${width} ${layout.height}" aria-hidden="true">
        ${propsSvg(level, layout, width)}
        <path d="${curve(layout.nodes)}" class="road-base"/>
        <path d="${curve(layout.nodes)}" class="road-dash"/>
        <path d="${curve(layout.nodes, 0, cur)}" class="road-done" id="roadDone"/>
      </svg>
      ${layout.signs.map(sg => {
        const ud = sg.unit.lessons.filter(l => state.completed[l.id]).length;
        return `<div class="signpost ${sg.left ? "left" : "right"}" style="top:${sg.y}px">
          <span class="sp-icon">${sg.unit.icon}</span><span><b>${esc(sg.unit.title)}</b><small>${ud}/${sg.unit.lessons.length}</small></span></div>`;
      }).join("")}
      ${layout.nodes.map((n, idx) => {
        const l = n.lesson, isDone = !!state.completed[l.id], open = isUnlocked(n.unit, n.i);
        const cls = idx === cur && !isDone ? "current" : isDone ? "done" : open ? "open" : "locked";
        const face = l.ai && !l.generated ? "✦" : FACE[l.type](l);
        return `<button class="mnode ${cls}" data-n="${idx}" style="left:${n.x}px;top:${n.y}px;--i:${idx}" ${open ? "" : 'aria-disabled="true"'} aria-label="${esc(l.title)}${isDone ? " (done)" : open ? "" : " (locked)"}">
          <span class="mn-disc"><span class="mn-face">${esc(face)}</span>${isDone ? '<span class="mn-check">✓</span>' : ""}${open ? "" : '<span class="mn-lock">🔒</span>'}</span>
          <span class="mn-label">${esc(l.title)}</span>
          ${cls === "current" ? '<span class="mn-start">START</span>' : ""}
        </button>`;
      }).join("")}
      <div class="map-kitsu" id="mapKitsu" aria-hidden="true">${Mascot.svg("happy", 58)}</div>
    </div>
    <div class="map-end">${pct === 1 ? `🎉 You finished ${R.name}!` : `Keep going — ${all.length - done} lessons left in ${R.name}.`}</div>`;

  // wiring
  Mascot.bindTap($view);
  bindDailyPlan($view);
  $view.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { if (b.dataset.level !== level.id) flyToLevel(b.dataset.level); });
  $view.querySelectorAll("#placeBtn").forEach(b => b.onclick = startPlacement);
  document.getElementById("dueBtn")?.addEventListener("click", () => setTab("review"));
  document.getElementById("wotdBtn")?.addEventListener("click", () => openWotd(wotd));
  $view.querySelectorAll(".mnode").forEach(b => b.onclick = () => {
    const n = layout.nodes[b.dataset.n];
    if (!isUnlocked(n.unit, n.i)) { b.classList.remove("nudge"); void b.offsetWidth; b.classList.add("nudge"); Mascot.sfx("wrong"); toast("Finish the lesson before this one first"); return; }
    Mascot.sfx("tap"); openPreview(n.lesson);
  });
  document.getElementById("regions").querySelector(".active")?.scrollIntoView({ inline: "center", block: "nearest" });

  // Kitsu: sit on the current node, or fly there from where she was last time.
  const kitsu = document.getElementById("mapKitsu");
  // On a node Kitsu sits beside it (away from the road's bend); in flight she's centered over the road.
  const placeKitsu = (p, beside) => {
    const x = beside ? (p.x > layout.cx ? p.x - 112 : p.x + 50) : p.x - 29;
    kitsu.style.transform = `translate(${x}px, ${beside ? p.y - 58 : p.y - 86}px)`;
  };
  const map = document.getElementById("map");
  const mapTop = () => map.offsetTop;
  const centerOn = (y, smooth) => $view.scrollTo({ top: mapTop() + y - $view.clientHeight * 0.55, behavior: smooth ? "smooth" : "auto" });
  state.mapPos = state.mapPos || {};
  const last = state.mapPos[level.id];
  if (last !== undefined && last < cur && layout.nodes[last] && !REDUCE()) {
    placeKitsu(layout.nodes[last], true);
    centerOn(layout.nodes[last].y, false);
    setTimeout(() => flyKitsu(layout, last, cur, kitsu, placeKitsu, centerOn), 500);
  } else {
    placeKitsu(layout.nodes[cur], true);
    if (cur > 0 && (!firstJourneyRender || done)) centerOn(layout.nodes[cur].y, false);
  }
  state.mapPos[level.id] = cur; save();
  firstJourneyRender = false;
  startAmbient(R.ambient);
}

function flyKitsu(layout, from, to, kitsu, placeKitsu, centerOn) {
  const map = document.getElementById("map");
  if (!map) return;
  const path = document.createElementNS(SVGNS, "path");
  path.setAttribute("d", curve(layout.nodes, from, to));
  map.querySelector(".map-svg").append(path);
  const L = path.getTotalLength(), dur = Math.min(2400, 900 + (to - from) * 500), t0 = performance.now();
  const done = map.querySelector("#roadDone");
  const fullDone = curve(layout.nodes, 0, to);
  kitsu.classList.add("flying");
  Mascot.sfx("whoosh");
  let lastSpark = 0;
  const step = now => {
    if (!document.body.contains(path)) return;
    const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const p = path.getPointAtLength(L * e);
    placeKitsu({ x: p.x, y: p.y - Math.sin(t * Math.PI) * 30 });
    centerOn(p.y, false);
    if (now - lastSpark > 60) { lastSpark = now; spark(map, p.x, p.y - 40 - Math.sin(t * Math.PI) * 30); }
    if (t < 1) requestAnimationFrame(step);
    else {
      path.remove(); kitsu.classList.remove("flying"); kitsu.classList.add("landed");
      placeKitsu(layout.nodes[to], true);
      done.setAttribute("d", fullDone);
      const node = map.querySelector(`.mnode[data-n="${to}"]`); node?.classList.add("arrive");
      Mascot.sfx("right");
    }
  };
  requestAnimationFrame(step);
}

function spark(map, x, y) {
  const s = document.createElement("span");
  s.className = "spark"; s.style.left = x + (Math.random() - .5) * 20 + "px"; s.style.top = y + (Math.random() - .5) * 20 + "px";
  s.textContent = Math.random() < .5 ? "✦" : "•";
  map.append(s); setTimeout(() => s.remove(), 900);
}

// Fly through the clouds to another region.
function flyToLevel(id) {
  if (REDUCE()) { state.level = id; save(); renderJourney(); return; }
  stopAmbient();
  const fx = document.createElement("div");
  fx.className = "fly-fx";
  fx.innerHTML = `<div class="fly-wash"></div>
    ${Array.from({ length: 7 }, (_, i) => `<div class="fly-cloud" style="--d:${i};top:${8 + i * 13}%"></div>`).join("")}
    <div class="fly-kitsu">${Mascot.svg("wow", 96)}</div>
    <div class="fly-title">${REGIONS[id].jp}<small>${REGIONS[id].name}</small></div>`;
  document.body.append(fx);
  Mascot.sfx("whoosh");
  setTimeout(() => { state.level = id; save(); $view.scrollTop = 0; renderJourney(); }, 700);
  setTimeout(() => fx.remove(), 1600);
}

// Bottom sheet that previews a lesson before starting it.
function openPreview(lesson) {
  const done = !!state.completed[lesson.id];
  const items = (lesson.items || []).slice(0, 6);
  const sheet = document.createElement("div");
  sheet.className = "sheet-wrap";
  sheet.innerHTML = `<div class="sheet-backdrop"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(lesson.title)}">
      <div class="sheet-grab"></div>
      <div class="sheet-type">${TYPE_LABEL[lesson.type] || "Lesson"}${done ? " · completed" : ""}</div>
      <h2 class="sheet-title">${esc(lesson.title)}</h2>
      ${lesson.point ? `<div class="sheet-point">${esc(lesson.point)}</div>` : ""}
      ${items.length ? `<div class="sheet-items">${items.map(it => `<span>${esc(it.jp)}</span>`).join("")}${lesson.items.length > 6 ? `<span class="more">+${lesson.items.length - 6}</span>` : ""}</div>` : ""}
      ${lesson.ai && !lesson.generated ? `<p class="muted">✨ Lía will write this lesson for you when you start (about a minute, only once).</p>` : ""}
      <div class="sheet-meta"><span>⭐ +10–20 XP</span>${state.notes?.[lesson.id] ? "<span>📝 You have a note</span>" : ""}</div>
      <button class="btn" id="sheetGo">${done ? "Practice again" : "Start lesson"}</button>
    </div>`;
  document.body.append(sheet);
  requestAnimationFrame(() => sheet.classList.add("open"));
  const close = cb => { sheet.classList.remove("open"); setTimeout(() => { sheet.remove(); cb?.(); }, REDUCE() ? 0 : 260); };
  sheet.querySelector(".sheet-backdrop").onclick = () => close();
  sheet.querySelector("#sheetGo").onclick = () => close(() => startLesson(lesson));
  sheet.querySelector("#sheetGo").focus();
}

function openWotd(w) {
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Word of the day">
    <div class="sheet-grab"></div><div class="sheet-type">Word of the day</div>
    <div class="wotd-big">${esc(w.jp)}</div>
    <p style="text-align:center;margin:0 0 14px">${w.kana ? esc(w.kana) + " · " : ""}${esc(w.romaji)}<br><span class="muted">${esc(w.en)}</span></p>
    <div class="tr-actions"><button class="btn secondary" id="wSay">🔊 Listen</button>
    <button class="btn" id="wAdd">${state.srs[w.id] ? "✓ In review" : "+ Add to review"}</button></div></div>`;
  document.body.append(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  const close = () => { wrap.classList.remove("open"); setTimeout(() => wrap.remove(), 260); };
  wrap.querySelector(".sheet-backdrop").onclick = close;
  wrap.querySelector("#wSay").onclick = () => speak(w.kana || w.jp);
  wrap.querySelector("#wAdd").onclick = () => {
    if (!state.srs[w.id]) { state.srs[w.id] = { box: 0, due: Date.now(), seen: 0, right: 0 }; save(); toast("Added to your review deck"); }
    close();
  };
  speak(w.kana || w.jp);
}

// Parallax for the far scenery layer.
$view.addEventListener("scroll", () => {
  const far = document.getElementById("mapFar");
  if (far) far.style.transform = `translateY(${$view.scrollTop * 0.35}px)`;
}, { passive: true });
let resizeT;
window.addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => { if (currentTab === "home" && !document.body.classList.contains("in-lesson")) renderJourney(); }, 200);
});
VIEWS.home = renderJourney;
