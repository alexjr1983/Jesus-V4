/* ============================================================
   companion.js — Estados del compañero animado (mascota jugador
   del Estudiantes). Solo controla clases CSS; toda la animación
   en sí vive en styles.css para que sea ligera y no dependa de
   librerías externas.
   ============================================================ */

function setCompanionTalking(on) {
  const el = document.getElementById("companion");
  if (el) el.classList.toggle("talking", !!on);
}

function celebrateCompanion() {
  const el = document.getElementById("companion");
  if (!el) return;
  el.classList.add("happy");
  setTimeout(() => el.classList.remove("happy"), 1300);
}

/* ============================================================
   Celebración grande — botón manual "🎉 Celebrar".
   No es automática: es la familia o el profesor quien decide el
   momento (un logro real, algo bien hecho, lo que sea) y toca el
   botón junto al Amigo IA para celebrarlo con Jesús a lo grande.
   Alterna al azar entre "pelota a canasta + confeti" y "fuegos
   artificiales", con sonido y vibración. Respeta "Reducir
   movimiento" del sistema: si está activado, solo suena/vibra y
   se muestra un mensaje breve, sin animación en pantalla.
   ============================================================ */
function celebrateBig() {
  celebrateCompanion();
  playCelebrationChime();
  if (navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 140]);
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { flashSimpleCelebration(); return; }
  (Math.random() < 0.5 ? playBasketCelebration : playFireworksCelebration)();
}

function flashSimpleCelebration() {
  const bubble = document.getElementById("aiText");
  if (!bubble) return;
  const prev = bubble.textContent;
  bubble.textContent = "🎉 ¡Muy bien, Jesús!";
  setTimeout(() => { bubble.textContent = prev; }, 2200);
}

function makeCelebrationOverlay() {
  const ov = document.createElement("div");
  ov.className = "celebrateOverlay";
  document.body.appendChild(ov);
  setTimeout(() => ov.remove(), 2700);
  return ov;
}

function spawnConfetti(ov, count = 46) {
  const colors = ["#f97316", "#2563eb", "#16a34a", "#eab308", "#ec4899", "#8b5cf6"];
  for (let n = 0; n < count; n++) {
    const p = document.createElement("div");
    p.className = "confetti";
    p.style.left = (Math.random() * 100) + "vw";
    p.style.background = colors[n % colors.length];
    p.style.animationDuration = (1.5 + Math.random() * 1.1) + "s";
    p.style.animationDelay = (Math.random() * 0.35) + "s";
    ov.appendChild(p);
  }
}

function playBasketCelebration() {
  const ov = makeCelebrationOverlay();
  ov.innerHTML = `
    <div class="bigHoop"><div class="hoopRim"></div><div class="hoopNet"></div></div>
    <div class="bigBall">🏀</div>`;
  setTimeout(() => spawnConfetti(ov), 650);
}

function playFireworksCelebration() {
  const ov = makeCelebrationOverlay();
  for (let b = 0; b < 5; b++) setTimeout(() => spawnBurst(ov), b * 340);
}
function spawnBurst(ov) {
  if (!ov.isConnected) return;
  const cx = 15 + Math.random() * 70, cy = 12 + Math.random() * 45;
  const colors = ["#f97316", "#facc15", "#38bdf8", "#f472b6", "#a3e635"];
  for (let n = 0; n < 18; n++) {
    const s = document.createElement("div");
    s.className = "spark";
    const angle = (n / 18) * Math.PI * 2;
    const dist = 55 + Math.random() * 45;
    s.style.left = cx + "vw"; s.style.top = cy + "vh";
    s.style.background = colors[n % colors.length];
    s.style.color = colors[n % colors.length];
    s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    s.style.setProperty("--dy", Math.sin(angle) * dist + "px");
    ov.appendChild(s);
  }
}

/* Acorde ascendente corto (do-mi-sol-do agudo) con Web Audio API.
   Si el navegador bloquea audio sin interacción previa, la
   celebración sigue siendo válida solo con lo visual y la vibración. */
function playCelebrationChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [523, 659, 784, 1047].forEach((freq, idx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "triangle"; osc.frequency.value = freq;
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch (e) { /* sin audio, la celebración sigue siendo visual */ }
}
