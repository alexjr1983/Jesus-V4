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

/* ---------- Control de sesión de habla ----------
   Cada llamada a speak() abre una "sesión" nueva con un número
   propio. Si llega otra llamada antes de que termine (Jesús toca
   otro icono rápido), la sesión vieja se marca como caducada y
   sus callbacks (onstart/onend/el bucle keep-alive) dejan de
   actuar sobre la pantalla o la cola de voz. Así nunca se pisan
   dos utterances ni se llama a cancel()+speak() a la vez, que en
   iOS Safari deja la cola de voz colgada. */
let speechSession = 0;
let keepAliveTimer = null;

function stopKeepAlive() {
  if (keepAliveTimer) { clearTimeout(keepAliveTimer); keepAliveTimer = null; }
}

/* iOS Safari corta cualquier utterance de más de ~15s por un bug
   del sistema (cree que se ha "quedado colgada" y la mata). El
   truco conocido para evitarlo es hacer pause()+resume() cada
   pocos segundos mientras siga hablando: eso "despierta" al motor
   de voz sin interrumpir el audio. */
function startKeepAlive(session) {
  stopKeepAlive();
  const tick = () => {
    if (session !== speechSession) return; // sesión caducada, no tocar nada
    if (!speechSynthesis.speaking) return;
    speechSynthesis.pause();
    speechSynthesis.resume();
    keepAliveTimer = setTimeout(tick, 4000);
  };
  keepAliveTimer = setTimeout(tick, 4000);
}

function speak(t) {
  if (!("speechSynthesis" in window)) return;
  const session = ++speechSession; // invalida cualquier speak() anterior en curso
  stopKeepAlive();
  speechSynthesis.cancel();

  const startSpeaking = () => {
    if (session !== speechSession) return; // llegó otro toque mientras cancelábamos
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "es-ES"; u.rate = settings.rate || 0.9; u.pitch = 1;
    if (settings.voiceURI) {
      const v = voicesList.find(v => v.voiceURI === settings.voiceURI);
      if (v) u.voice = v;
    }
    u.onstart = () => { if (session === speechSession) { setCompanionTalking(true); startKeepAlive(session); } };
    u.onend = () => { if (session === speechSession) { setCompanionTalking(false); stopKeepAlive(); } };
    u.onerror = () => { if (session === speechSession) { setCompanionTalking(false); stopKeepAlive(); } };
    speechSynthesis.speak(u);
  };

  // Pequeño respiro tras cancel(): en iOS, encadenar cancel()+speak()
  // en el mismo tick es lo que deja la cola de voz colgada.
  setTimeout(startSpeaking, 60);
}

function setAI(t) {
  const el = document.getElementById("aiText");
  if (el) el.textContent = t;
}
