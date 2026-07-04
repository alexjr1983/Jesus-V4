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
