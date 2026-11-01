"use strict";
// Writing practice: trace kana/kanji over a faint guide and get a score.
// Scoring compares your ink with the character's shape (coverage + accuracy).
// It doesn't know stroke order, so each card links to a stroke-order video.

const GLYPH_FONT = '"Hiragino Sans", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

function openTracer(list, startIdx = 0) {
  let idx = startIdx, strokes = [], guide = true;
  const wrap = document.createElement("div");
  wrap.className = "tracer";
  document.body.append(wrap);
  const close = () => { wrap.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);

  function draw() {
    const it = list[idx];
    wrap.innerHTML = `<div class="tracer-box" role="dialog" aria-modal="true" aria-label="Writing practice">
      <div class="lesson-top">
        <button class="icon-btn" id="trClose" aria-label="Close">✕</button>
        <div style="flex:1"><b>Writing practice</b> <span class="muted">${idx + 1}/${list.length}</span></div>
        <button class="chip-btn" id="trGuide">${guide ? "Hide" : "Show"} guide</button>
      </div>
      <div class="tr-info"><b class="tr-char">${esc(it.jp)}</b>
        <span>${esc(it.kana || it.romaji)}${it.type === "kanji" ? ` · ${esc(it.en)}` : ""}</span>
        <button class="chip-btn" id="trSay">🔊</button></div>
      <canvas id="pad" class="pad" aria-label="Drawing area"></canvas>
      <div id="trFb" class="tr-fb">Trace the character with your finger or mouse.</div>
      <div class="tr-actions">
        <button class="btn secondary" id="trClear">Clear</button>
        <button class="btn" id="trCheck">Check</button>
      </div>
      <div class="tr-actions">
        <button class="btn secondary" id="trPrev" ${idx === 0 ? "disabled" : ""}>← Prev</button>
        <button class="btn secondary" id="trNext" ${idx === list.length - 1 ? "disabled" : ""}>Next →</button>
      </div>
      <div style="text-align:center">${videoLink(`${it.jp} ${it.type === "kanji" ? "kanji" : "kana"} stroke order`, "Stroke order video")}</div>
    </div>`;
    const pad = wrap.querySelector("#pad");
    const S = Math.min(320, wrap.querySelector(".tracer-box").clientWidth - 8);
    const dpr = window.devicePixelRatio || 1;
    pad.style.width = pad.style.height = S + "px";
    pad.width = pad.height = S * dpr;
    const g = pad.getContext("2d");
    g.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--text").trim() || "#2b2230";
    const faint = css.getPropertyValue("--border").trim() || "#f0e2e8";
    const accent = css.getPropertyValue("--pink").trim() || "#ff7aa2";

    const paint = () => {
      g.clearRect(0, 0, S, S);
      g.strokeStyle = faint; g.lineWidth = 1; g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(S / 2, 0); g.lineTo(S / 2, S); g.moveTo(0, S / 2); g.lineTo(S, S / 2); g.stroke(); g.setLineDash([]);
      if (guide) glyph(g, it.jp, S, faint);
      g.strokeStyle = ink; g.lineWidth = S * 0.055; g.lineCap = g.lineJoin = "round";
      strokes.forEach(st => { g.beginPath(); st.forEach(([x, y], i) => (i ? g.lineTo(x * S, y * S) : g.moveTo(x * S, y * S))); g.stroke(); });
    };
    paint();

    let cur = null;
    const pos = e => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    pad.onpointerdown = e => { pad.setPointerCapture(e.pointerId); cur = [pos(e)]; strokes.push(cur); paint(); };
    pad.onpointermove = e => { if (cur) { cur.push(pos(e)); paint(); } };
    pad.onpointerup = pad.onpointercancel = () => { cur = null; };

    wrap.querySelector("#trClose").onclick = close;
    wrap.querySelector("#trSay").onclick = () => speak(it.kana ? it.kana.split("・")[0] : it.jp);
    wrap.querySelector("#trGuide").onclick = () => { guide = !guide; draw(); };
    wrap.querySelector("#trClear").onclick = () => { strokes = []; paint(); wrap.querySelector("#trFb").textContent = "Trace the character with your finger or mouse."; };
    wrap.querySelector("#trPrev").onclick = () => { idx--; strokes = []; draw(); };
    wrap.querySelector("#trNext").onclick = () => { idx++; strokes = []; draw(); };
    wrap.querySelector("#trCheck").onclick = () => {
      const score = scoreTrace(it.jp, strokes);
      const ok = score >= 55;
      const msg = score >= 75 ? "Beautiful!" : score >= 55 ? "Good — that's readable." : strokes.length ? "Keep going — try to follow the shape." : "Draw something first!";
      wrap.querySelector("#trFb").innerHTML = `${Mascot.react(ok, 0)}<b>${score}%</b> · ${msg}`;
      if (ok) { grade(it.id, true); save(); if (score >= 75) Mascot.confetti(); }
      // Show the model in the accent color over the drawing.
      g.globalAlpha = 0.35; glyph(g, it.jp, S, accent); g.globalAlpha = 1;
    };
  }
  draw();
}

// Draws the character centered in an S×S box (centered on its real ink, not the font's em box).
function glyph(g, ch, S, color, strokeW = 0) {
  g.font = `${Math.round(S * 0.78)}px ${GLYPH_FONT}`;
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  const m = g.measureText(ch);
  const w = (m.actualBoundingBoxRight || 0) + (m.actualBoundingBoxLeft || 0) || S * 0.78;
  const h = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0) || S * 0.78;
  const x = (S - w) / 2 + (m.actualBoundingBoxLeft || 0);
  const y = (S - h) / 2 + (m.actualBoundingBoxAscent || S * 0.68);
  g.fillStyle = color;
  g.fillText(ch, x, y);
  if (strokeW) { g.strokeStyle = color; g.lineWidth = strokeW; g.lineJoin = "round"; g.strokeText(ch, x, y); }
}

// 0–100: harmonic mean of how much of the character you covered and how much of your ink is on it.
function scoreTrace(ch, strokes) {
  if (!strokes.length) return 0;
  const N = 96;
  const layer = draw => { const c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d"); draw(g); return g.getImageData(0, 0, N, N).data; };
  const ink = w => g => { g.strokeStyle = "#000"; g.lineWidth = w; g.lineCap = g.lineJoin = "round";
    strokes.forEach(st => { g.beginPath(); st.forEach(([x, y], i) => (i ? g.lineTo(x * N, y * N) : g.moveTo(x * N, y * N))); if (st.length === 1) g.lineTo(st[0][0] * N + .1, st[0][1] * N); g.stroke(); }); };
  const shape = w => g => glyph(g, ch, N, "#000", w);
  const G = layer(shape(0)), GD = layer(shape(N * 0.09)), I = layer(ink(N * 0.055)), ID = layer(ink(N * 0.15));
  let g = 0, gHit = 0, i = 0, iHit = 0;
  for (let k = 3; k < G.length; k += 4) {
    if (G[k] > 100) { g++; if (ID[k] > 100) gHit++; }
    if (I[k] > 100) { i++; if (GD[k] > 100) iHit++; }
  }
  if (!g || !i) return 0;
  const cover = gHit / g, prec = iHit / i;
  return Math.round(100 * (2 * cover * prec) / (cover + prec || 1));
}
