"use strict";
// Notes: one note per lesson plus free notes, saved on this device.

state.notes = state.notes || {};

function openNote(id, title) {
  const existing = state.notes[id];
  const wrap = document.createElement("div");
  wrap.className = "modal";
  wrap.innerHTML = `<div class="modal-box note-box" role="dialog" aria-modal="true" aria-label="Note">
    <input class="note-title" id="noteTitle" value="${esc(existing?.title || title || "")}" placeholder="Title" aria-label="Note title">
    <textarea id="noteText" class="note-text" placeholder="Write anything: tricky points, example sentences, mnemonics…">${esc(existing?.text || "")}</textarea>
    <div class="note-foot"><span class="muted" id="noteSaved">${existing ? "Saved" : ""}</span>
      ${existing ? `<button class="chip-btn" id="noteDel">Delete</button>` : ""}
      <button class="btn" id="noteDone" style="width:auto;padding:10px 18px">Done</button></div>
  </div>`;
  document.body.append(wrap);
  const ta = wrap.querySelector("#noteText"), ti = wrap.querySelector("#noteTitle");
  let timer;
  const persist = () => {
    const text = ta.value.trim(), t = ti.value.trim();
    if (!text) { delete state.notes[id]; }
    else state.notes[id] = { title: t || title || "Note", text: ta.value, updated: Date.now(), lesson: !String(id).startsWith("free-") };
    save();
    wrap.querySelector("#noteSaved").textContent = text ? "Saved" : "";
  };
  ta.oninput = ti.oninput = () => { clearTimeout(timer); timer = setTimeout(persist, 300); };
  const close = () => { clearTimeout(timer); persist(); wrap.remove(); if (currentTab === "notes" && !document.body.classList.contains("in-lesson")) renderNotes(); };
  wrap.querySelector("#noteDone").onclick = close;
  const del = wrap.querySelector("#noteDel");
  if (del) del.onclick = () => askConfirm("Delete this note?", "Delete").then(ok => { if (ok) { ta.value = ""; close(); } });
  ta.focus();
}

let noteFilter = "";
function renderNotes() {
  const list = Object.entries(state.notes)
    .filter(([, n]) => !noteFilter || (n.title + " " + n.text).toLowerCase().includes(noteFilter.toLowerCase()))
    .sort((a, b) => b[1].updated - a[1].updated);
  $view.innerHTML = `
    <h2>My notes</h2>
    <div class="answer-bar" style="margin-bottom:12px">
      <input class="type-input" id="noteSearch" placeholder="Search notes…" value="${esc(noteFilter)}" style="margin:0">
      <button class="btn" id="newNote" style="width:auto;padding:12px 16px">＋ New</button>
    </div>
    ${list.length ? list.map(([id, n]) => `
      <button class="card note-card" data-id="${esc(id)}">
        <b>${n.lesson ? "📘 " : "📝 "}${esc(n.title)}</b>
        <span class="muted">${esc(n.text.slice(0, 120))}${n.text.length > 120 ? "…" : ""}</span>
        <small class="muted">${new Date(n.updated).toLocaleDateString()}</small>
      </button>`).join("") : `
      ${Mascot.bubbleHtml({ jp: "¡Escribe tu primera nota!", en: noteFilter ? "No notes match that search." : "Tap 📝 during any lesson, or ＋ New, to write your first note." }, "normal", 72)}`}
    <p class="muted" style="font-size:.8rem">Notes are saved on this device.</p>`;
  const search = document.getElementById("noteSearch");
  search.oninput = () => { noteFilter = search.value; const pos = search.selectionStart; renderNotes(); const s2 = document.getElementById("noteSearch"); s2.focus(); s2.setSelectionRange(pos, pos); };
  document.getElementById("newNote").onclick = () => openNote("free-" + Date.now(), "");
  $view.querySelectorAll(".note-card").forEach(c => c.onclick = () => openNote(c.dataset.id, state.notes[c.dataset.id].title));
  Mascot.bindTap($view);
}
VIEWS.notes = renderNotes;
