/* ============================================================
   speech.js — Voz (síntesis de texto a voz del navegador).
   ============================================================ */

let voicesList = [];

function populateVoices() {
  voicesList = speechSynthesis.getVoices();
  const es = voicesList.filter(v => v.lang && v.lang.toLowerCase().startsWith("es"));
  const shown = es.length ? es : voicesList;
  const sel = document.getElementById("voiceSelect");
  if (!sel) return;
  sel.innerHTML = '<option value="">(voz por defecto)</option>' +
    shown.map(v => `<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join("");
  sel.value = settings.voiceURI || "";
}

function initSpeech() {
  if (!("speechSynthesis" in window)) return;
  populateVoices();
  speechSynthesis.onvoiceschanged = populateVoices;
}

function speak(t) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t);
  u.lang = "es-ES"; u.rate = settings.rate || 0.9; u.pitch = 1;
  if (settings.voiceURI) {
    const v = voicesList.find(v => v.voiceURI === settings.voiceURI);
    if (v) u.voice = v;
  }
  speechSynthesis.speak(u);
}

function setAI(t) {
  const el = document.getElementById("aiText");
  if (el) el.textContent = t;
}
