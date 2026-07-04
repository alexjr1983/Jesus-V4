/* ============================================================
   profile.js — Perfil personal de Jesús: personas clave, lugares
   clave y rutina semanal. Se guarda por separado del vocabulario
   (data.js) para que la predicción, la agenda y el modo cuidador
   puedan usarlo sin mezclar "vocabulario de fábrica" con "la vida
   real de Jesús".
   ============================================================ */

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const DEFAULT_PROFILE = {
  name: "Jesús",
  people: [],     // { id, name, relation, quick }
  places: [],     // { id, name, kind }  kind: "casa" | "colegio" | "otro"
  routine: []     // { id, days, start, end, label, mode } mode: "school"|"home"|"bad"|""
};

async function loadProfile() {
  try {
    const p = await idbGet("profile");
    if (p) return Object.assign(JSON.parse(JSON.stringify(DEFAULT_PROFILE)), p);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
}
async function saveProfileData() {
  try { await idbSet("profile", profile); }
  catch (e) { try { localStorage.setItem("jesus_profile", JSON.stringify(profile)); } catch (e2) {} }
}

/* ---------- Rutina: ¿qué franja toca ahora mismo? ----------
   Permite que el modo del día (lectivo / no lectivo / difícil) se
   ajuste solo según la hora y el día, en vez de depender de que
   alguien lo cambie a mano cada vez. */
const ROUTINE_DAY_ORDER = ["L", "M", "X", "J", "V", "S", "D"];
function expandRoutineDays(daysStr) {
  const set = new Set();
  (daysStr || "").toUpperCase().replace(/\s+/g, "").split(",").filter(Boolean).forEach(part => {
    if (part.includes("-")) {
      const [a, b] = part.split("-");
      let i = ROUTINE_DAY_ORDER.indexOf(a);
      const iEnd = ROUTINE_DAY_ORDER.indexOf(b);
      if (i === -1 || iEnd === -1) return;
      while (true) { set.add(ROUTINE_DAY_ORDER[i]); if (i === iEnd) break; i = (i + 1) % 7; }
    } else if (ROUTINE_DAY_ORDER.includes(part)) set.add(part);
  });
  return set;
}
function detectRoutineMode(prof, date) {
  if (!prof || !prof.routine || !prof.routine.length) return null;
  const todayLetter = ["D", "L", "M", "X", "J", "V", "S"][date.getDay()];
  const hhmm = date.toTimeString().slice(0, 5);
  for (const r of prof.routine) {
    if (!r.mode) continue;
    if (!expandRoutineDays(r.days).has(todayLetter)) continue;
    if (hhmm >= r.start && hhmm <= r.end) return r.mode;
  }
  return null;
}
