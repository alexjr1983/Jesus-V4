/* ============================================================
   matia-v8.js — MatIA V8. Todo local: nada sale del dispositivo.
   Se carga después de matia-extras.js y antes de app.js.
   Principio: la app propone, Jesús elige. Nada reorganiza la
   cuadrícula sola; el aprendizaje solo toca la barra de sugerencias.
   ============================================================ */

/* ---------- Vistas de Jesús: Comunicar · Jugar · Necesito · Mis frases ---------- */
const VIEWS = ["comunicar", "jugar", "necesito", "frases"];
let currentView = "comunicar";
function setView(v, quiet) {
  if (!VIEWS.includes(v)) v = "comunicar";
  currentView = v;
  document.body.dataset.view = v;
  VIEWS.forEach(k => { const b = document.getElementById("nav_" + k); if (b) b.classList.toggle("active", k === v); });
  if (v === "necesito") { needReset(); }
  if (v === "frases") renderPhrases();
  if (v === "jugar") renderDaily();
  const sc = document.getElementById("mainScroll"); if (sc) sc.scrollTop = 0;
  if (!quiet && navigator.vibrate) navigator.vibrate(10);
}
const _updateCaregiverUI = updateCaregiverUI;
updateCaregiverUI = function () {
  _updateCaregiverUI();
  document.body.classList.toggle("cg", !!caregiverMode);
  renderBackupBanner();
};

/* ---------- Utilidades ---------- */
function mk(name, icon, speech) { return { id: "x_" + slug(name), name, icon, speech: speech || name }; }
function itemOr(id, name, icon, speech) { return findItem(id) || mk(name, icon, speech); }
const BUCKETS = ["madrugada", "mañana", "tarde", "noche"];
function bucketOf(h) { return h < 7 ? 0 : h < 13 ? 1 : h < 20 ? 2 : 3; }
function bucketName(i) { return ["de madrugada", "por la mañana", "por la tarde", "por la noche"][i]; }
const DOW = ["los domingos", "los lunes", "los martes", "los miércoles", "los jueves", "los viernes", "los sábados"];

/* ---------- Registro de contexto (día de la semana × franja) ---------- */
const _learnTransition = learnTransition;
learnTransition = function (id) {
  _learnTransition(id);
  const d = new Date(); data.ctx = data.ctx || {};
  const k = d.getDay() + "|" + bucketOf(d.getHours());
  (data.ctx[k] = data.ctx[k] || {})[id] = (data.ctx[k][id] || 0) + 1;
};

/* ---------- Predicción contextual (solo la barra de sugerencias) ----------
   Orden: patrones aceptados por el cuidador → trigrama → contexto
   día+franja → resto de V7. Máximo 5, sin duplicados. */
function acceptedPicks() {
  const d = new Date(), dow = d.getDay(), b = bucketOf(d.getHours()), out = [];
  (data.accepted || []).forEach(p => {
    const hit = (p.kind === "bucket" && p.key === b) || (p.kind === "dow" && p.key === dow) || (p.kind === "after" && p.after === lastRealId);
    if (hit) out.push(findItem(p.id));
  });
  return out;
}
function ctxPicks() {
  const d = new Date(), m = (data.ctx || {})[d.getDay() + "|" + bucketOf(d.getHours())] || {};
  return Object.entries(m).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => findItem(id));
}
const _bsp2 = buildSmartPredictions;
buildSmartPredictions = function (hour) {
  const base = _bsp2(hour), out = [], seen = new Set();
  [...acceptedPicks(), ...base.slice(0, 2), ...ctxPicks(), ...base.slice(2)].forEach(it => {
    if (it && it.id && !seen.has(it.id)) { seen.add(it.id); out.push(it); }
  });
  return out.slice(0, 5);
};

/* ---------- Necesito: "Quiero…" en dos pasos ---------- */
function needReset() { needStep = "menu"; renderNeed(); }
let needStep = "menu", needLast = null;
const WANT = [
  { k: "comer", icon: "🍽️", name: "Comer", go: () => wantGo("wantEat") },
  { k: "beber", icon: "🥤", name: "Beber", say: "Quiero beber" },
  { k: "bano", icon: "🚽", name: "Baño", say: "Quiero ir al baño" },
  { k: "descansar", icon: "🛏️", name: "Descansar", say: "Quiero descansar" },
  { k: "ir", icon: "🚗", name: "Ir", go: () => wantGo("wantGo") },
  { k: "estar", icon: "👨‍👩‍👦", name: "Estar con alguien", go: () => wantGo("wantPerson") },
  { k: "carino", icon: "❤️", name: "Cariño", say: "Quiero un abrazo" },
  { k: "molesta", icon: "😣", name: "Me molesta algo", go: () => { needStep = "feel"; renderNeed(); } },
  { k: "nosedecir", icon: "❓", name: "No sé decirlo", go: () => { needStep = "feel"; renderNeed(); } }
];
function wantGo(kind) { setView("comunicar"); smartStart(kind); }
function logNeed(key) {
  data.log = data.log || {}; const day = dayKey(); const id = "n:" + key;
  (data.log[day] = data.log[day] || {})[id] = (data.log[day][id] || 0) + 1;
  const d = new Date(); data.ctx = data.ctx || {}; const k = d.getDay() + "|" + bucketOf(d.getHours());
  (data.ctx[k] = data.ctx[k] || {})[id] = (data.ctx[k][id] || 0) + 1;
  saveData();
}
function sayNeed(key, text) {
  logNeed(key); needLast = text; speak(text); setAI(text);
  needStep = "said"; renderNeed();
}
function wantTap(k) {
  const w = WANT.find(x => x.k === k); if (!w) return;
  if (w.go) { w.go(); return; }
  sayNeed("quiero_" + k, w.say);
}

/* ---------- ¿Qué me pasa? Sensación → zona (sin diagnóstico) ---------- */
const FEEL = [
  { k: "duele", icon: "😣", name: "Me duele", zone: true, say: "Me duele" },
  { k: "cansado", icon: "😴", name: "Estoy cansado", say: "Estoy cansado" },
  { k: "enfadado", icon: "😡", name: "Estoy enfadado", say: "Estoy enfadado" },
  { k: "triste", icon: "😢", name: "Estoy triste", say: "Estoy triste" },
  { k: "ruido", icon: "🔊", name: "Hay mucho ruido", say: "Hay mucho ruido" },
  { k: "luz", icon: "💡", name: "Hay mucha luz", say: "Hay mucha luz" },
  { k: "mal", icon: "🤢", name: "Me encuentro mal", zone: true, say: "Me encuentro mal" },
  { k: "contigo", icon: "🫂", name: "Quiero estar contigo", say: "Quiero estar contigo" },
  { k: "nolose", icon: "❓", name: "No lo sé", say: "No sé qué me pasa. Necesito ayuda" }
];
const ZONES = [
  { k: "cabeza", icon: "🧠", name: "Cabeza", say: "en la cabeza" }, { k: "boca", icon: "🦷", name: "Boca", say: "en la boca" },
  { k: "barriga", icon: "🫃", name: "Barriga", say: "en la barriga" }, { k: "pierna", icon: "🦵", name: "Pierna", say: "en la pierna" },
  { k: "mano", icon: "✋", name: "Mano", say: "en la mano" }, { k: "todo", icon: "🧍", name: "Todo el cuerpo", say: "en todo el cuerpo" }
];
let feelPick = null;
function feelTap(k) {
  const f = FEEL.find(x => x.k === k); if (!f) return;
  if (f.zone) { feelPick = f; needStep = "zone"; renderNeed(); speak(f.say + ". ¿Dónde?"); return; }
  sayNeed("siento_" + f.k, f.say);
}
function zoneTap(k) {
  const z = ZONES.find(x => x.k === k); if (!z || !feelPick) return;
  const text = feelPick.say + " " + z.say; const key = "siento_" + feelPick.k + "_" + z.k;
  feelPick = null; sayNeed(key, text);
}
function needBtn(it, fn, k) { return `<button class="cardbtn needBtn" onclick="${fn}('${k}')"><div class="emoji">${it.icon}</div><div class="label">${escapeHtml(it.name)}</div></button>`; }
function renderNeed() {
  const box = document.getElementById("needBox"); if (!box) return;
  if (needStep === "menu") {
    box.innerHTML = `<div class="needTitle">❤️ ¿Qué quieres?</div><div class="grid needGrid">${WANT.map(w => needBtn(w, "wantTap", w.k)).join("")}</div>`;
  } else if (needStep === "feel") {
    box.innerHTML = `<div class="needTitle">¿Qué te pasa?</div><div class="grid needGrid">${FEEL.map(f => needBtn(f, "feelTap", f.k)).join("")}</div><div class="row" style="margin-top:10px"><button onclick="needReset()">← Volver</button></div>`;
  } else if (needStep === "zone") {
    box.innerHTML = `<div class="needTitle">¿Dónde?</div><div class="grid needGrid">${ZONES.map(z => needBtn(z, "zoneTap", z.k)).join("")}</div><div class="row" style="margin-top:10px"><button onclick="needStep='feel';renderNeed()">← Volver</button></div>`;
  } else {
    box.innerHTML = `<div class="needSaid">${escapeHtml(needLast || "")}</div><div class="row" style="justify-content:center;margin-top:12px"><button class="primary bigSpeak" onclick="speak(needLast)">🔊 Repetir</button><button onclick="needReset()">✔️ Hecho</button></div>`;
  }
}

/* ---------- Mis frases: esenciales fijas + guardadas por uso ---------- */
const ESSENTIAL = [
  { icon: "🆘", text: "Necesito ayuda" }, { icon: "😣", text: "Me duele" }, { icon: "🍽️", text: "Tengo hambre" },
  { icon: "🥤", text: "Tengo sed" }, { icon: "🚽", text: "Quiero ir al baño" }, { icon: "😴", text: "Estoy cansado" },
  { icon: "🏀", text: "Quiero jugar" }, { icon: "❤️", text: "Te quiero" }
];
function sayEssential(i) { const e = ESSENTIAL[i]; if (!e) return; logNeed("frase_" + i); speak(e.text); setAI(e.text); }
function renderPhrases() {
  const box = document.getElementById("phrasesBox"); if (!box) return;
  const favs = [...favorites].sort((a, b) => (b.uses || 0) - (a.uses || 0));
  box.innerHTML = `<div class="grid needGrid">${ESSENTIAL.map((e, i) => `<button class="cardbtn needBtn" onclick="sayEssential(${i})"><div class="emoji">${e.icon}</div><div class="label">${escapeHtml(e.text)}</div></button>`).join("")}</div>` +
    (favs.length ? `<div class="needTitle" style="margin-top:14px">⭐ Mis frases</div><div class="grid needGrid">${favs.map(f => `<button class="cardbtn needBtn" onclick="speakFavorite('${f.id}')"><div class="emoji">⭐</div><div class="label">${escapeHtml(f.text)}</div></button>`).join("")}</div>` : "");
  renderFavorites();
}

/* ---------- Amigo MatIA local: plantillas, sin API, sin preguntas de sí/no ---------- */
function localFriendReply(text) {
  const last = sentence[sentence.length - 1]; if (!last) return null;
  const t = catTypeOf(last), n = (last.name || "").toLowerCase();
  if (sentence.length >= 3) return "¡Muy bien, Jesús! Has dicho una frase larga: " + text + ".";
  if (t === "persona") return "Has tocado " + n + ". Puedes tocar un verbo o un lugar para seguir.";
  if (t === "verbo") return "Has tocado " + n + ". Ahora elige con quién o dónde.";
  if (t === "lugar") return "Has tocado " + n + ". Si quieres ir, toca quiero e ir.";
  if (t === "objeto") return "Has tocado " + n + ". Toca quiero para pedirlo.";
  if (t === "cuerpo") return "Has tocado " + n + ". Puedes tocar me duele o estoy mal.";
  return null;
}
const _askAi = askAiCompanion;
askAiCompanion = async function (t) { return (await _askAi(t)) || localFriendReply(t); };

/* ---------- Expansión de frase por reglas (Jesús elige: literal o completa) ---------- */
const PLACE_ART = { colegio: "al colegio", cole: "al cole", parque: "al parque", piscina: "a la piscina", casa: "a casa", baño: "al baño", bano: "al baño", médico: "al médico", medico: "al médico", polideportivo: "al polideportivo", campo: "al campo", playa: "a la playa", tienda: "a la tienda" };
function expandSentence() {
  if (!sentence || sentence.length !== 1) return null;
  const it = sentence[0], t = catTypeOf(it), n = (it.speech || it.name || "").toLowerCase();
  if (["quiero", "yo", "si", "no", "mas", "ayuda"].includes(it.id)) return null;
  if (t === "objeto") return "Quiero " + n;
  if (t === "persona") return "Quiero estar con " + n;
  if (t === "lugar") return "Quiero ir " + (PLACE_ART[n] || "a " + n);
  if (t === "descriptor") return "Estoy " + n;
  return null;
}
const _renderSentence = renderSentence;
renderSentence = function () {
  _renderSentence();
  const box = document.getElementById("expandBox"); if (!box) return;
  const e = expandSentence();
  box.innerHTML = e ? `<button class="cardbtn expandBtn" onclick="speakExpanded()">✨ Decir completo: “${escapeHtml(e)}”</button>` : "";
};
function speakExpanded() { const e = expandSentence(); if (!e) return; logNeed("expandida"); speak(e); setAI(e); }

/* ---------- Patrones que MatIA detecta (el cuidador acepta o ignora) ---------- */
function detectPatterns() {
  const ctx = data.ctx || {}, tot = {}, byB = {}, byD = {};
  Object.entries(ctx).forEach(([k, m]) => {
    const [d, b] = k.split("|").map(Number);
    Object.entries(m).forEach(([id, c]) => {
      if (id.startsWith("n:")) return;
      tot[id] = (tot[id] || 0) + c;
      (byB[id] = byB[id] || {})[b] = (byB[id][b] || 0) + c;
      (byD[id] = byD[id] || {})[d] = (byD[id][d] || 0) + c;
    });
  });
  const res = [], done = new Set((data.accepted || []).concat(data.rejected || []).map(p => p.sig));
  const push = p => { if (!done.has(p.sig) && findItem(p.id)) res.push(p); };
  Object.keys(tot).forEach(id => {
    if (tot[id] < 6) return;
    Object.entries(byB[id]).forEach(([b, c]) => { if (c / tot[id] >= 0.6) push({ sig: id + "|b|" + b, id, kind: "bucket", key: +b, text: `«${findItem(id).name}» se usa sobre todo ${bucketName(+b)} (${c} de ${tot[id]} veces).` }); });
    Object.entries(byD[id]).forEach(([d, c]) => { if (c / tot[id] >= 0.5 && tot[id] >= 8) push({ sig: id + "|d|" + d, id, kind: "dow", key: +d, text: `«${findItem(id).name}» aparece sobre todo ${DOW[+d]} (${c} de ${tot[id]} veces).` }); });
  });
  Object.entries(data.sequences || {}).forEach(([a, m]) => {
    const sum = Object.values(m).reduce((x, y) => x + y, 0);
    Object.entries(m).forEach(([b, c]) => { if (c >= 4 && c / sum >= 0.6 && findItem(a) && findItem(b)) push({ sig: a + ">" + b, id: b, kind: "after", after: a, text: `Después de «${findItem(a).name}» suele venir «${findItem(b).name}» (${c} de ${sum} veces).` }); });
  });
  return res.slice(0, 5);
}
let _pats = [];
function renderPatterns() {
  const box = document.getElementById("patternsBox"); if (!box) return;
  _pats = detectPatterns();
  if (!_pats.length) { box.innerHTML = '<div class="mini">🔎 Patrones: aún no hay suficientes datos de uso (hacen falta unas semanas).</div>'; return; }
  box.innerHTML = '<b>🔎 Patrones detectados</b>' + _pats.map((p, i) => `<div style="margin-top:8px"><div class="small" style="color:var(--ink)">🧠 ${escapeHtml(p.text)}</div><div class="row" style="margin-top:4px"><button class="primary" onclick="acceptPattern(${i})">➕ Añadir a predicción</button><button onclick="rejectPattern(${i})">Ignorar</button></div></div>`).join("") +
    '<div class="mini" style="margin-top:6px">Aceptar solo prioriza esa palabra en la barra de sugerencias cuando coincida; no mueve nada más.</div>';
}
async function acceptPattern(i) { const p = _pats[i]; if (!p) return; (data.accepted = data.accepted || []).push(p); await saveData(); renderPatterns(); renderPredictions(); }
async function rejectPattern(i) { const p = _pats[i]; if (!p) return; (data.rejected = data.rejected || []).push({ sig: p.sig }); await saveData(); renderPatterns(); }

/* ---------- Palabra a enseñar + modelado guiado ---------- */
function teachNext() {
  const seen = new Set(Object.values(data.log || {}).flatMap(m => Object.keys(m)));
  return (data.items.nucleo || []).find(x => x.id && !seen.has(x.id)) || null;
}
function guideTo(id) {
  setView("comunicar");
  const cat = Object.keys(data.items).find(c => data.items[c].some(x => x.id === id));
  if (cat && cat !== "nucleo") setActiveCat(cat);
  setTimeout(() => {
    document.querySelectorAll("button[onclick*='addById(\"" + id + "\")']").forEach(b => { b.classList.add("guide"); b.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => b.classList.remove("guide"), 6000); });
  }, 120);
}
function needLabel(key) {
  const p = key.split("_"), k = p[0];
  if (k === "quiero") { const w = WANT.find(x => x.k === p[1]); return "Quiero: " + (w ? w.name.toLowerCase() : p.slice(1).join(" ")); }
  if (k === "siento") { const f = FEEL.find(x => x.k === p[1]), z = ZONES.find(x => x.k === p[2]); return (f ? f.name : p[1]) + (z ? " (" + z.name.toLowerCase() + ")" : ""); }
  if (k === "frase") { const e = ESSENTIAL[+p[1]]; return "Frase: " + (e ? e.text : p.slice(1).join(" ")); }
  if (k === "expandida") return "Frase completa";
  return key;
}
weekReport = function () {
  const tot = {}, needs = {}; let n = 0;
  for (let i = 0; i < 7; i++) Object.entries((data.log || {})[dayKey(new Date(Date.now() - i * 864e5))] || {}).forEach(([id, c]) => {
    if (id.startsWith("n:")) needs[id.slice(2)] = (needs[id.slice(2)] || 0) + c; else { tot[id] = (tot[id] || 0) + c; n += c; }
  });
  const nn = Object.values(needs).reduce((a, b) => a + b, 0);
  if (!n && !nn) return '<div class="mini">Informe semanal: aún no hay datos de esta semana.</div>';
  const nm = id => (findItem(id) || { name: id }).name;
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, c]) => escapeHtml(nm(id)) + " (" + c + ")").join(" · ");
  const seen = new Set(Object.values(data.log || {}).flatMap(m => Object.keys(m)));
  const idle = (data.items.nucleo || []).filter(x => !seen.has(x.id)).slice(0, 6).map(x => escapeHtml(x.name)).join(", ");
  const lv = [["Busca", motorBusca], ["Números", motorNumeros], ["Memoria", motorMemoria], ["Letras", motorLetras]].map(([k, m]) => k + " " + m.getNivel()).join(" · ");
  const needTxt = Object.entries(needs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, c]) => escapeHtml(needLabel(k)) + " (" + c + ")").join(" · ");
  const t = teachNext();
  return `<b>Informe de los últimos 7 días</b><ul style="margin:6px 0 0 18px"><li>${n} toques en pictos.</li>` +
    (top ? `<li>Más usadas: ${top}.</li>` : "") +
    (needTxt ? `<li>Necesidades y frases esenciales: ${needTxt}.</li>` : "") +
    (idle ? `<li>Núcleo sin usar en 60 días: ${idle}. Valora practicarlas juntos.</li>` : "") +
    `<li>Nivel en juegos: ${lv}. Balones hoy: ${ballsDay.n} · total: ${gameBalls}.</li></ul><div class="mini">Son datos orientativos; los cambios los decides tú.</div>` +
    (t ? `<div style="margin-top:8px">📌 <b>Palabra a practicar esta semana:</b> ${escapeHtml(t.name)} <button onclick="guideTo('${t.id}')" style="margin-left:6px">🎯 Mostrar dónde está</button></div>` : "");
};
const _renderInsights2 = renderInsights;
renderInsights = function () { _renderInsights2(); renderPatterns(); };

/* ---------- Informe para terapeuta (se abre listo para Imprimir → Guardar como PDF) ---------- */
function therapistStats() {
  const log = data.log || {}, days = Object.keys(log).sort(), words = {}, first = {};
  days.forEach(d => Object.entries(log[d]).forEach(([id, c]) => { if (id.startsWith("n:")) return; words[id] = (words[id] || 0) + c; if (!first[id]) first[id] = d; }));
  const ids = Object.keys(words), total = ids.reduce((a, id) => a + words[id], 0);
  const core = new Set((data.items.nucleo || []).map(x => x.id));
  const coreTouches = ids.filter(id => core.has(id)).reduce((a, id) => a + words[id], 0);
  const lens = diary.map(d => (d.items || []).length).filter(n => n > 0);
  const mlu = lens.length ? (lens.reduce((a, b) => a + b, 0) / lens.length) : null;
  const wk = {}; ids.forEach(id => { const w = Math.floor((new Date(first[id] + "T12:00:00") - new Date(days[0] + "T12:00:00")) / (7 * 864e5)); wk[w] = (wk[w] || 0) + 1; });
  const needs = {}; days.forEach(d => Object.entries(log[d]).forEach(([id, c]) => { if (id.startsWith("n:")) needs[id.slice(2)] = (needs[id.slice(2)] || 0) + c; }));
  return { days, ids, total, words, coreTouches, mlu, wk, needs, nDiary: lens.length };
}
function openTherapistReport() {
  const s = therapistStats(), nm = id => (findItem(id) || { name: id }).name;
  const top = Object.entries(s.words).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, c]) => `<tr><td>${escapeHtml(nm(id))}</td><td>${c}</td></tr>`).join("");
  const wk = Object.keys(s.wk).sort((a, b) => a - b).map(w => `<tr><td>Semana ${+w + 1}</td><td>${s.wk[w]}</td></tr>`).join("");
  const needs = Object.entries(s.needs).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, c]) => `<tr><td>${escapeHtml(needLabel(k))}</td><td>${c}</td></tr>`).join("");
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe MatIA</title><style>body{font:15px system-ui,Arial;margin:24px;color:#17202a}h1{font-size:20px}h2{font-size:16px;margin:18px 0 6px}table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #ddd;padding:4px 6px}.note{color:#5f6b7a;font-size:12px;margin-top:18px}button{font-size:16px;padding:10px 16px;margin-bottom:12px}@media print{button{display:none}}</style>
<button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
<h1>MatIA · Informe de comunicación</h1><div>Generado el ${new Date().toLocaleDateString("es-ES")} · Periodo con datos: ${s.days.length ? s.days[0] + " a " + s.days[s.days.length - 1] : "sin datos"} (${s.days.length} días con uso)</div>
<h2>Resumen</h2><table><tr><td>Selecciones totales</td><td>${s.total}</td></tr><tr><td>Vocabulario distinto usado</td><td>${s.ids.length} palabras</td></tr><tr><td>Proporción de vocabulario nuclear</td><td>${s.total ? Math.round(100 * s.coreTouches / s.total) + " %" : "—"}</td></tr><tr><td>Longitud media de frase (frases guardadas en el diario)</td><td>${s.mlu ? s.mlu.toFixed(1) + " palabras (n = " + s.nDiary + ")" : "sin frases guardadas"}</td></tr></table>
<h2>Palabras más usadas</h2><table>${top || "<tr><td>Sin datos</td></tr>"}</table>
<h2>Palabras nuevas por semana</h2><table>${wk || "<tr><td>Sin datos</td></tr>"}</table>
<h2>Expresión de necesidades y sensaciones</h2><table>${needs || "<tr><td>Sin datos</td></tr>"}</table>
<div class="note">Limitaciones: el registro conserva los últimos 60 días; la longitud media de frase solo cuenta frases guardadas en el diario, así que es orientativa y no equivale a un análisis logopédico. Datos generados en el dispositivo; no se ha enviado nada a ningún servidor.</div></html>`;
  const w = window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
  if (!w) alert("Tu navegador bloqueó la ventana. Permite ventanas emergentes para este sitio y vuelve a pulsar.");
}

/* ---------- Copia de seguridad con fecha ---------- */
function daysSinceBackup() { return settings.lastBackup ? Math.floor((Date.now() - settings.lastBackup) / 864e5) : null; }
function renderBackupBanner() {
  const e = document.getElementById("backupInfo"); if (!e) return;
  const n = daysSinceBackup();
  e.innerHTML = n === null ? "⚠️ Todavía no has hecho ninguna copia." : (n === 0 ? "✅ Última copia: hoy." : (n > 7 ? "⚠️ " : "") + "Última copia hace " + n + " día" + (n === 1 ? "" : "s") + ".");
  const b = document.getElementById("backupAlert"); if (b) b.style.display = (n === null || n > 7) && caregiverMode ? "" : "none";
}
function createBackup() {
  const { aiApiKey, pixabayApiKey, pin, ...safeSettings } = settings; // las claves y el PIN no salen en la copia
  const payload = { app: "MatIA", version: 8, created: new Date().toISOString(), data, diary, favorites, profile, balls: gameBalls, settings: safeSettings };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
  a.download = "Jesus_MatIA_backup_" + dayKey() + ".matia"; a.click();
  settings.lastBackup = Date.now(); saveSettings(); renderBackupBanner();
}
exportData = createBackup;
const _importData2 = importData;
importData = function (ev) {
  _importData2(ev);
  const f = ev.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { const o = JSON.parse(r.result); if (o.settings) { const keep = { aiApiKey: settings.aiApiKey, pixabayApiKey: settings.pixabayApiKey, pin: settings.pin }; Object.assign(settings, o.settings, keep); saveSettings(); applySettings(); } } catch (e) {} };
  r.readAsText(f);
};

/* ---------- Parche del HTML por JavaScript ----------
   Así la V8 funciona aunque index.html y styles.css sean de la V7:
   basta con subir js/app.js y js/matia-v8.js. Si el HTML ya es el nuevo,
   no hace nada. */
const MATIA_CSS = `/* ---------- MatIA V7 ---------- */
#coreRow .cardbtn.core{min-height:64px}
#coreRow .cardbtn.core .sub{display:none}
.gameAiRow + .grid .cardbtn.gameCard{min-height:84px}

/* ---------- MatIA V8: vistas de Jesús ---------- */
.v-comunicar,.v-jugar,.v-necesito,.v-frases,.v-comunicar-cg,.v-frases-cg{display:none}
body[data-view=comunicar] .v-comunicar,body[data-view=jugar] .v-jugar,body[data-view=necesito] .v-necesito,body[data-view=frases] .v-frases{display:block}
body.cg[data-view=comunicar] .v-comunicar-cg,body.cg[data-view=frases] .v-frases-cg{display:block}
body:not(.cg) .celebrateBtn{display:none}
body:not(.cg) .top .small{display:none}
.bottom .inner .navBtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;font-size:.95rem;font-weight:700;border-radius:18px;background:#fff;border:2px solid var(--border)}
.bottom .inner .navBtn span{font-size:1.7rem;line-height:1}
.bottom .inner .navBtn.active{background:var(--soft);border-color:var(--brand);color:var(--brand)}
.needGrid{grid-template-columns:repeat(3,minmax(0,1fr))}
.needBtn{min-height:110px}
.needBtn .emoji{font-size:2.6rem}
.needBtn .label{font-size:1rem;font-weight:800}
.needTitle{font-size:1.25rem;font-weight:800;margin-bottom:10px}
.needSaid{font-size:2rem;font-weight:800;text-align:center;padding:26px 8px}
.expandBtn{width:100%;padding:14px;font-size:1.05rem;font-weight:700;border-style:dashed}
.cardbtn.guide{animation:guidePulse 1s ease-in-out infinite;outline:5px solid #f59e0b;outline-offset:-3px}
@keyframes guidePulse{50%{transform:scale(1.07)}}

/* ---------- MatIA V9: ajustes de maquetación móvil ---------- */
.bottom .inner{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.bottom .inner .navBtn{min-width:0;padding:6px 2px;font-size:.82rem;line-height:1.1;text-align:center}
.bottom .inner .navBtn span{font-size:1.5rem}
#expandBox ~ .row{display:grid!important;grid-template-columns:1fr 1fr;gap:8px}
#expandBox ~ .row .bigSpeak{grid-column:1/-1;min-height:60px;font-size:1.15rem}
#expandBox ~ .row button{min-width:0;padding:10px 6px;font-size:.92rem}
`;
function patchDom() {
  if (document.getElementById("nav_comunicar")) return;
  try {
    const st = document.createElement("style"); st.id = "matia-css"; st.textContent = MATIA_CSS; document.head.appendChild(st);
    document.title = "MatIA";
    const mt = document.querySelector('meta[name="apple-mobile-web-app-title"]'); if (mt) mt.setAttribute("content", "MatIA");
    const q = s => document.querySelector(s);
    const main = document.getElementById("mainScroll");
    if (main) {
      [...main.children].forEach(p => {
        if (!p.classList.contains("panel")) return;
        if (p.classList.contains("gameLaunchPanel")) p.classList.add("v-jugar");
        else if (p.classList.contains("mode")) p.classList.add("v-comunicar-cg");
        else if (p.querySelector("#favoritesList")) p.classList.add("v-frases-cg");
        else if (p.querySelector("#sentence") || p.querySelector("#predictions") || p.querySelector("#tabs") || p.querySelector("#items")) p.classList.add("v-comunicar");
      });
      const sen = document.getElementById("sentence");
      if (sen && !document.getElementById("expandBox")) { const d = document.createElement("div"); d.id = "expandBox"; d.style.marginTop = "8px"; sen.insertAdjacentElement("afterend", d); }
      const pr = document.getElementById("predictions");
      if (pr && pr.parentElement) { const t = pr.parentElement.querySelector(".small"); if (t) t.innerHTML = "<b>💡 Quizá quieres…</b>"; }
      const fav = q("#favoritesList"); const favPanel = fav && fav.closest(".panel");
      const mkPanel = (cls, id) => { const d = document.createElement("div"); d.className = "panel " + cls; d.innerHTML = '<div id="' + id + '"></div>'; return d; };
      const anchor = favPanel || main.lastElementChild;
      anchor.insertAdjacentElement("beforebegin", mkPanel("v-necesito", "needBox"));
      anchor.insertAdjacentElement("beforebegin", mkPanel("v-frases", "phrasesBox"));
    }
    const inner = q(".bottom .inner");
    if (inner) inner.innerHTML =
      '<button id="nav_comunicar" class="navBtn" onclick="setView(\'comunicar\')"><span>🗣️</span>Comunicar</button>' +
      '<button id="nav_necesito" class="navBtn" onclick="setView(\'necesito\')"><span>❤️</span>Necesito</button>' +
      '<button id="nav_frases" class="navBtn" onclick="setView(\'frases\')"><span>⭐</span>Mis frases</button>' +
      '<button id="nav_jugar" class="navBtn" onclick="setView(\'jugar\')"><span>🎮</span>Jugar</button>';
    const pinBtn = document.querySelector('#caregiverBar button[onclick="changePin()"]');
    if (pinBtn && !document.getElementById("backupAlert")) { const b = document.createElement("button"); b.id = "backupAlert"; b.style.display = "none"; b.textContent = "⚠️ Copia pendiente"; b.setAttribute("onclick", "openSheet('editorPanel')"); pinBtn.insertAdjacentElement("beforebegin", b); }
    const wk = document.getElementById("weeklyBox") || document.getElementById("insightsBox");
    if (wk && !document.getElementById("patternsBox")) {
      const pb = document.createElement("div"); pb.id = "patternsBox"; pb.className = "small"; pb.style.marginTop = "12px";
      const tb = document.createElement("div"); tb.className = "row"; tb.style.marginTop = "12px"; tb.innerHTML = '<button class="primary" onclick="openTherapistReport()">📄 Informe para terapeuta</button>';
      wk.insertAdjacentElement("afterend", pb); pb.insertAdjacentElement("afterend", tb);
    }
    const ex = document.querySelector('button[onclick="exportData()"]'); if (ex) { ex.textContent = "📦 Crear copia de seguridad"; ex.classList.add("primary"); }
    const im = document.querySelector('button[onclick="importClick()"]');
    if (im) { im.textContent = "📥 Restaurar copia"; if (!document.getElementById("backupInfo")) { const d = document.createElement("div"); d.id = "backupInfo"; d.className = "small"; d.style.width = "100%"; im.insertAdjacentElement("afterend", d); } }
    const inf = document.getElementById("importFile"); if (inf) inf.setAttribute("accept", ".matia,.json,application/json");
  } catch (e) { console.warn("MatIA patchDom:", e); }
}
patchDom();

setView("comunicar", true);
