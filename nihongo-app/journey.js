"use strict";
// The Learn tab: a journey map across Japan. Each level is a region with its own
// season, scenery and ambient particles. Kitsu sits on your current lesson and
// flies along the road when you finish one.

const REGIONS = {
  A1: { name: "Sakura Village", jp: "桜の村", kanji: "桜", ambient: "petals", props: ["sakura", "house", "sakura", "lantern", "sakura"] },
  A2: { name: "Festival Coast", jp: "祭りの浜", kanji: "祭", ambient: "fireflies", props: ["lantern", "wave", "lantern", "torii", "wave"] },
  B1: { name: "Maple Mountains", jp: "紅葉の山", kanji: "紅", ambient: "leaves", props: ["maple", "torii", "mountain", "maple", "pine"] },
  B2: { name: "Neon City", jp: "夜の街", kanji: "街", ambient: "snow", props: ["building", "building", "lantern", "pine", "building"] },
  C1: { name: "Ancient Capital", jp: "古都", kanji: "都", ambient: "petals", props: ["pagoda", "bamboo", "torii", "bamboo", "pine"] },
  C2: { name: "Fuji Summit", jp: "富士の頂", kanji: "富", ambient: "sparkles", props: ["mountain", "cloud", "pine", "cloud", "mountain"] },
};
const REDUCE = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const SVGNS = "http://www.w3.org/2000/svg";

// ---------- scenery props (drawn at origin, base at y=0) ----------
const PROP = {
  sakura: () => `<path d="M0 0 V-26 M0 -16 l-8 -8 M0 -20 l7 -7" stroke="#8a5a44" stroke-width="4" stroke-linecap="round" fill="none"/>
    <g fill="#ffb7cb"><circle cx="-10" cy="-33" r="11"/><circle cx="6" cy="-38" r="13"/><circle cx="14" cy="-27" r="9"/><circle cx="-2" cy="-25" r="9"/></g>
    <g fill="#ff8fb1" opacity=".75"><circle cx="2" cy="-41" r="5"/><circle cx="-12" cy="-30" r="4"/><circle cx="12" cy="-30" r="3"/></g>`,
  house: () => `<rect x="-15" y="-18" width="30" height="18" rx="2" fill="#f4e6d2"/><path d="M-20 -17 L0 -33 L20 -17Z" fill="#5b4c86"/><rect x="-4" y="-10" width="8" height="10" fill="#8a5a44"/><rect x="7" y="-14" width="5" height="5" fill="#ffd27a"/>`,
  lantern: () => `<ellipse cx="0" cy="-22" rx="20" ry="22" fill="#ffb347" opacity=".2"/><line x1="0" y1="-46" x2="0" y2="-35" stroke="#5b4c86" stroke-width="2"/><ellipse cx="0" cy="-22" rx="10" ry="13" fill="#ff5a4e"/><path d="M-10 -22 H10 M-9 -16 H9 M-9 -28 H9" stroke="#d63c33" stroke-width="1"/><rect x="-7" y="-36" width="14" height="3" rx="1" fill="#f5b53f"/><rect x="-7" y="-11" width="14" height="3" rx="1" fill="#f5b53f"/>`,
  wave: () => `<path d="M-28 0 q7 -11 14 0 t14 0 t14 0 t14 0" stroke="#4f9fe0" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-21 9 q6 -8 12 0 t12 0 t12 0" stroke="#8cc6f0" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  torii: () => `<rect x="-16" y="-34" width="5" height="34" fill="#e8433a"/><rect x="11" y="-34" width="5" height="34" fill="#e8433a"/><rect x="-20" y="-29" width="40" height="4" fill="#c7352d"/><path d="M-25 -41 Q0 -45 25 -41 L23 -35 L-23 -35Z" fill="#e8433a"/><rect x="-26" y="-44" width="52" height="4" rx="2" fill="#2f2747"/>`,
  maple: () => `<path d="M0 0 V-22" stroke="#7a4a36" stroke-width="4" stroke-linecap="round"/><g fill="#f0703a"><circle cx="-9" cy="-29" r="10"/><circle cx="7" cy="-33" r="12"/><circle cx="12" cy="-23" r="8"/></g><g fill="#d94a2b" opacity=".85"><circle cx="-2" cy="-23" r="7"/><circle cx="2" cy="-38" r="5"/></g>`,
  mountain: () => `<path d="M-36 0 L0 -46 L36 0Z" fill="#7d88cc"/><path d="M-36 0 L0 -46 L-6 0Z" fill="#6a74b8"/><path d="M-11 -32 L0 -46 L11 -32 L5 -28 L0 -32 L-5 -28Z" fill="#fff"/>`,
  building: () => {
    let w = ""; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if ((r * 3 + c) % 4 !== 1) w += `<rect x="${-10 + c * 8}" y="${-52 + r * 10}" width="4" height="5" fill="#ffd36e"/>`;
    return `<rect x="-14" y="-58" width="28" height="58" rx="2" fill="#4a4f8f"/>${w}<rect x="-3" y="-64" width="6" height="6" fill="#ff5f8f"/>`;
  },
  pine: () => `<path d="M0 0 V-8" stroke="#6b4a36" stroke-width="4"/><path d="M-13 -8 L0 -38 L13 -8Z" fill="#3f8f6a"/><path d="M-9 -20 L0 -46 L9 -20Z" fill="#52a87e"/>`,
  pagoda: () => `<rect x="-2" y="-70" width="4" height="10" fill="#2f2747"/>${[0, 1, 2].map(i => `<rect x="${-10 + i * 2}" y="${-20 - i * 18}" width="${20 - i * 4}" height="12" fill="#c7352d"/><path d="M${-20 + i * 3} ${-20 - i * 18} L${20 - i * 3} ${-20 - i * 18} L${14 - i * 3} ${-26 - i * 18} L${-14 + i * 3} ${-26 - i * 18}Z" fill="#2f2747"/>`).join("")}<rect x="-12" y="-8" width="24" height="8" fill="#c7352d"/>`,
  bamboo: () => [-8, 0, 8].map((x, i) => `<path d="M${x} 0 V${-40 - i * 6}" stroke="#5fb37a" stroke-width="4" stroke-linecap="round"/><path d="M${x - 2} -14 H${x + 2} M${x - 2} -28 H${x + 2}" stroke="#3f8f5a" stroke-width="2"/><path d="M${x} ${-34 - i * 6} q8 -4 12 2" stroke="#5fb37a" stroke-width="2" fill="none"/>`).join(""),
  cloud: () => `<g fill="#fff" opacity=".9"><ellipse cx="0" cy="-12" rx="24" ry="10"/><ellipse cx="-12" cy="-17" rx="12" ry="9"/><ellipse cx="10" cy="-21" rx="14" ry="11"/></g>`,
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

const FACE = { kana: l => l.items[0].jp, kanji: l => l.items[0].jp, grammar: () => "文", vocab: () => "語", reading: () => "読" };
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
  const N = kind === "fireflies" ? 14 : kind === "sparkles" ? 16 : 18;
  const ps = Array.from({ length: N }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: Math.random() * 0.6 + 0.5, a: Math.random() * 6.28, t: Math.random() * 100 }));
  const colors = { petals: "#ffb3c8", leaves: "#f08a4b", snow: "#ffffff", fireflies: "#ffe27a", sparkles: "#ffd36e" };
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
        <div class="eyebrow">${level.id} · JLPT ${level.jlpt} · ${esc(level.name)}</div>
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
    <div class="tools-row stagger">
      ${!state.placement && nothingDone ? `<button class="tool-chip hot" id="placeBtn">🎯 Find my level</button>` : ""}
      ${due ? `<button class="tool-chip" id="dueBtn">🔁 ${due} to review</button>` : ""}
      ${wotd ? `<button class="tool-chip" id="wotdBtn"><b>${esc(wotd.jp)}</b> word of the day</button>` : ""}
      ${videoLink(`learn Japanese JLPT ${level.jlpt} lesson`, `${level.jlpt} videos`).replace('class="video-link"', 'class="tool-chip"')}
      ${videoLink(`learn Japanese with anime ${level.jlpt}`, "Anime Japanese").replace('class="video-link"', 'class="tool-chip"')}
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
      ${lesson.ai && !lesson.generated ? `<p class="muted">✨ Kitsu will write this lesson for you when you start (about a minute, only once).</p>` : ""}
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
