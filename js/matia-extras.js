/* ============================================================
   matia-extras.js — MatIA V7. Todo ocurre en este dispositivo:
   nada se envía a ningún servidor. Se carga después de los demás
   js y antes de app.js; redefine solo lo imprescindible.
   ============================================================ */
function dayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function allItems() { return Object.entries(data.items).filter(([c]) => !GAME_EXCLUDED_CATS.includes(c)).flatMap(([, l]) => l).filter(x => x && x.id); }

/* ---------- Ajustes y PIN: copia redundante en IndexedDB ---------- */
async function restoreSettings() {
  try {
    const s = await idbGet("settings");
    if (s) {
      if (!localStorage.getItem("jesus_settings")) Object.assign(settings, s);
      else ["pin", "aiApiKey", "pixabayApiKey"].forEach(k => { if (!settings[k] && s[k]) settings[k] = s[k]; });
    }
  } catch (e) {}
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  saveSettings();
}

/* ---------- Aprendizaje local: bigramas + trigramas + registro diario ---------- */
let prevRealId = null;
function learnTransition(id) {
  data.log = data.log || {}; const day = dayKey();
  (data.log[day] = data.log[day] || {})[id] = (data.log[day][id] || 0) + 1;
  Object.keys(data.log).sort().slice(0, -60).forEach(k => delete data.log[k]);
  if (prevRealId && lastRealId) {
    data.tri = data.tri || {}; const k = prevRealId + ">" + lastRealId;
    (data.tri[k] = data.tri[k] || {})[id] = (data.tri[k][id] || 0) + 1;
  }
  prevRealId = lastRealId;
}
const _clearSentence = clearSentence;
clearSentence = function () { _clearSentence(); prevRealId = null; };
function recentScore(id) {
  const now = Date.now(); let s = 0;
  Object.entries(data.log || {}).forEach(([day, m]) => { if (m[id]) s += m[id] * Math.pow(0.9, Math.max(0, (now - new Date(day + "T12:00:00")) / 864e5)); });
  return s;
}
const _bsp = buildSmartPredictions;
buildSmartPredictions = function (hour) {
  const base = _bsp(hour);
  const tk = prevRealId && lastRealId && data.tri && data.tri[prevRealId + ">" + lastRealId];
  const tri = tk ? Object.entries(tk).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => findItem(id)) : [];
  const rec = allItems().map(x => [x, recentScore(x.id)]).filter(p => p[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 1).map(p => p[0]);
  const out = [], seen = new Set();
  [...tri, ...base.slice(0, 2), ...rec, ...base.slice(2)].forEach(it => { if (it && it.id && !seen.has(it.id)) { seen.add(it.id); out.push(it); } });
  return out.slice(0, 5);
};

/* ---------- Fila fija de núcleo: mismas posiciones en todas las categorías ---------- */
const CORE_IDS = ["si", "no", "mas", "ayuda"];
function renderCoreRow() {
  const el = document.getElementById("coreRow"); if (!el) return;
  el.style.gridTemplateColumns = "repeat(4,minmax(0,1fr))";
  el.innerHTML = CORE_IDS.map(findItem).filter(Boolean).map(it => cardHTML(it, "core")).join("");
}
const _renderItems = renderItems;
renderItems = function () { _renderItems(); renderCoreRow(); };

/* ---------- Favoritas: ordenadas por uso + sugerencias del diario ---------- */
let _sugg = [];
function suggestedPhrases() {
  const have = new Set(favorites.map(f => f.text.toLowerCase())), c = {};
  diary.forEach(d => { const t = (d.text || "").trim().toLowerCase(); if (t) c[t] = (c[t] || 0) + 1; });
  return Object.entries(c).filter(([t, n]) => n >= 2 && !have.has(t)).sort((a, b) => b[1] - a[1]).slice(0, 3);
}
renderFavorites = function () {
  const box = document.getElementById("favoritesList"); if (!box) return;
  const favs = [...favorites].sort((a, b) => (b.uses || 0) - (a.uses || 0));
  _sugg = suggestedPhrases();
  let h = favs.map(f => `<div class="row" style="justify-content:space-between;margin-bottom:6px"><button class="cardbtn" style="flex:1;text-align:left" onclick="speakFavorite('${f.id}')">⭐ ${escapeHtml(f.text)}</button><button onclick="deleteFavorite('${f.id}')" title="Borrar">🗑️</button></div>`).join("");
  h += _sugg.map(([t, n], i) => `<div class="mini" style="margin-top:6px">💡 Dicha ${n} veces en el diario:</div><button class="cardbtn" style="text-align:left;border-style:dashed" onclick="addSuggested(${i})">＋ ${escapeHtml(t)}</button>`).join("");
  box.innerHTML = h || '<span class="small">Aún no hay frases guardadas.</span>';
};
speakFavorite = function (id) {
  const f = favorites.find(x => x.id === id); if (!f) return;
  f.uses = (f.uses || 0) + 1; saveFavoritesData(favorites); speak(f.text);
};
async function addSuggested(i) {
  const s = _sugg[i]; if (!s) return;
  const d = diary.find(x => (x.text || "").trim().toLowerCase() === s[0]); if (!d) return;
  favorites.unshift({ id: "fav_" + Date.now(), text: d.text, items: JSON.parse(JSON.stringify(d.items || [])), uses: 0 });
  favorites = favorites.slice(0, 30); await saveFavoritesData(favorites); renderFavorites();
}

/* ---------- Balones: contador visible = hoy (se reinicia solo); total guardado aparte ---------- */
let ballsDay = { date: "", n: 0 };
function rollDay() { const d = dayKey(); if (ballsDay.date !== d) { ballsDay = { date: d, n: 0 }; saveBallsDay(); } }
async function saveBallsDay() { try { await idbSet("balls_day", ballsDay); } catch (e) {} }
function awardBall() {
  rollDay(); gameBalls++; ballsDay.n++;
  if (ballsDay.n === RETO_META && !ballsDay.reto) { ballsDay.reto = true; setTimeout(() => { celebrateCompanion(); playCelebrationChime(); }, 1800); }
  saveGameBalls(); saveBallsDay(); renderBallCounter(); pulseBallCounter();
}
renderBallCounter = function () {
  rollDay();
  ["ballCounter", "gameBallCounter", "gameBallCounter2"].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = "🏀 " + ballsDay.n; });
  renderDaily();
};
/* Reto ligero del día: 3 balones en cualquier juego. Se oculta en "Día difícil". */
const RETO_META = 3, RETO_JUEGOS = ["¿Qué busca MatIA?", "Números", "Memoria", "Letras"];
function renderDaily() {
  const el = document.getElementById("dailyChallenge"); if (!el) return;
  if (mode === "bad") { el.style.display = "none"; return; }
  el.style.display = "";
  const n = ballsDay.n, sug = RETO_JUEGOS[new Date().getDay() % 4];
  el.innerHTML = n >= RETO_META
    ? '<div class="small"><b>✅ ¡Reto de hoy conseguido!</b></div>'
    : `<div class="small"><b>🎯 Reto de hoy: ${Math.min(n, RETO_META)}/${RETO_META} balones</b></div><div class="mini">Sugerencia de hoy: ${sug}. Vale cualquier juego.</div>`;
}
const _initGame = initGame;
initGame = async function () { try { const v = await idbGet("balls_day"); if (v) ballsDay = v; } catch (e) {} await _initGame(); renderBallCounter(); };
setInterval(() => renderBallCounter(), 60000);

/* ---------- Refuerzo: "¡Bien!" / "¡Bravo!" / aplauso, al azar ---------- */
function playApplause() {
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const x = new C(), len = Math.floor(x.sampleRate * 1.4), buf = x.createBuffer(1, len, x.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.015 ? 1 : 0.15) * Math.pow(1 - i / len, 1.5);
    const s = x.createBufferSource(), f = x.createBiquadFilter(), g = x.createGain();
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = 1800; g.gain.value = 0.9;
    s.connect(f); f.connect(g); g.connect(x.destination); s.start();
  } catch (e) {}
}
function reinforce() {
  const r = Math.random();
  if (r < 0.66) speak(r < 0.33 ? "¡Bien!" : "¡Bravo!"); else playApplause();
  if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
}
reproducirAudioRefuerzo = reinforce;
var motorBusca = crearMotorDificultad("busca");

/* ---------- Hoja común para los juegos nuevos (sin PIN) ---------- */
function openExtra(title) {
  document.getElementById("extraTitle").textContent = title;
  document.getElementById("extraPanel").classList.add("open");
  if (navigator.vibrate) navigator.vibrate(15);
}
function closeExtra() {
  document.getElementById("extraPanel").classList.remove("open");
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

/* ---------- Memoria de parejas. Nivel 3: pictograma + palabra escrita ---------- */
var motorMemoria = crearMotorDificultad("memoria"), memo = null;
function openMemoria() { openExtra("🧩 Memoria"); motorMemoria.reiniciarRachas(); memoNueva(); }
function memoNueva() {
  const niv = motorMemoria.getNivel(), np = niv === 1 ? 2 : 3;
  let pool = allItems(); const used = pool.filter(x => (data.usage[x.id] || 0) > 0);
  if (used.length >= np) pool = used;
  const pick = shuffleArray(pool.slice()).slice(0, np);
  if (pick.length < np) { document.getElementById("extraBoard").innerHTML = "MatIA necesita más vocabulario para jugar."; return; }
  const cards = shuffleArray(pick.flatMap(x => [{ k: x.id }, { k: x.id, w: niv === 3 }]));
  memo = { cards, up: [], done: new Set(), errs: 0, lock: false, msg: "Busca las parejas. Toca dos tarjetas." };
  memoRender(); speak("Busca las parejas");
}
function memoRender() {
  const m = memo, cols = m.cards.length > 4 ? 3 : 2;
  document.getElementById("extraBoard").innerHTML = `<div class="gameAiRow"><div class="gameAvatar">🧩</div><div class="aiBubble">${m.msg}</div></div><div class="grid" style="margin-top:14px;grid-template-columns:repeat(${cols},minmax(0,1fr))">` +
    m.cards.map((c, i) => {
      const up = m.up.includes(i) || m.done.has(i), it = findItem(c.k);
      const face = !up ? "❓" : c.w ? `<span style="font-size:1.3rem;font-weight:800">${escapeHtml(it.name)}</span>` : (it.photo ? `<img src="${it.photo}">` : it.icon);
      return `<button class="cardbtn gameCard${m.done.has(i) ? " gameCorrect" : ""}" onclick="memoTap(${i})"><div class="emoji">${face}</div></button>`;
    }).join("") + "</div>";
}
function memoTap(i) {
  const m = memo; if (!m || m.lock || m.up.includes(i) || m.done.has(i)) return;
  m.up.push(i); if (navigator.vibrate) navigator.vibrate(8);
  speak(findItem(m.cards[i].k).name);
  if (m.up.length === 2) {
    const [a, b] = m.up;
    if (m.cards[a].k === m.cards[b].k) {
      m.done.add(a); m.done.add(b); m.up = [];
      if (m.done.size === m.cards.length) memoFin();
    } else {
      m.errs++; m.lock = true; memoRender();
      setTimeout(() => { m.up = []; m.lock = false; memoRender(); }, 1100); return;
    }
  }
  memoRender();
}
function memoFin() {
  const m = memo; m.lock = true;
  if (!m.errs) motorMemoria.registrarAcierto(); else if (m.errs >= 3) motorMemoria.registrarError();
  awardBall(); reinforce(); m.msg = "🎉 ¡Las has encontrado todas! Balón conseguido.";
  setTimeout(memoNueva, 2200);
}

/* ---------- Letras: vocales (niveles 1-2) y letras iniciales (nivel 3) ---------- */
var motorLetras = crearMotorDificultad("letras"), letraObj = null;
const VOCALES = "AEIOU".split(""), LETRAS = "ABCDEFGHIJLMNOPRSTUVZ".split("");
function inicial(s) { return ((s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()[0] || "").toUpperCase(); }
function openLetras() { openExtra("🔤 Letras"); motorLetras.reiniciarRachas(); letrasNueva(); }
function letrasNueva() {
  const niv = motorLetras.getNivel(), all = allItems().filter(x => /^[a-záéíóúñ]/i.test(x.name));
  let pool = niv < 3 ? all.filter(x => VOCALES.includes(inicial(x.name))) : all;
  if (!pool.length) pool = all;
  if (!pool.length) { document.getElementById("extraBoard").innerHTML = "MatIA necesita más vocabulario para jugar."; return; }
  const t = pool[Math.floor(Math.random() * pool.length)], L = inicial(t.name), base = niv < 3 ? VOCALES : LETRAS;
  const opts = shuffleArray([L, ...shuffleArray(base.filter(c => c !== L)).slice(0, opcionesSegunNivel(niv) - 1)]);
  letraObj = { t, L, niv, lock: false };
  document.getElementById("extraBoard").innerHTML = `<div class="gameAiRow"><div class="gameAvatar">🔤</div><div class="aiBubble" id="extraBubble">${niv < 3 ? "¿Con qué vocal empieza?" : "¿Con qué letra empieza?"}</div></div>` +
    `<div style="font-size:4.5rem;text-align:center;margin:14px 0">${t.photo ? `<img src="${t.photo}" style="max-height:110px">` : t.icon}</div>` +
    `<div class="grid" style="grid-template-columns:repeat(${opts.length},minmax(0,1fr))">` + opts.map(o => `<button class="cardbtn gameCard" style="font-size:1.8rem" onclick="letrasTap('${o}',this)">${o}</button>`).join("") + `</div>` +
    `<div class="row" style="justify-content:center;margin-top:8px"><button class="cardbtn" onclick="letrasDecir()">🔊 Repetir</button></div>`;
  letrasDecir();
}
function letrasDecir() { if (letraObj) speak(letraObj.t.name + ". " + (letraObj.niv < 3 ? "¿Con qué vocal empieza?" : "¿Con qué letra empieza?")); }
function letrasTap(o, btn) {
  if (!letraObj || letraObj.lock) return;
  if (o === letraObj.L) {
    letraObj.lock = true; motorLetras.registrarAcierto(); btn.classList.add("gameCorrect");
    awardBall(); reinforce(); const b = document.getElementById("extraBubble"); if (b) b.textContent = "🎉 ¡Eso es! Balón conseguido.";
    setTimeout(letrasNueva, 1500);
  } else {
    motorLetras.registrarError(); btn.classList.add("gameWrong"); setTimeout(() => btn.classList.remove("gameWrong"), 450);
  }
}

/* ---------- Informe semanal para el cuidador (solo lectura, local) ---------- */
function weekReport() {
  const tot = {}; let n = 0;
  for (let i = 0; i < 7; i++) Object.entries((data.log || {})[dayKey(new Date(Date.now() - i * 864e5))] || {}).forEach(([id, c]) => { tot[id] = (tot[id] || 0) + c; n += c; });
  if (!n) return '<div class="mini">Informe semanal: aún no hay datos de esta semana.</div>';
  const nm = id => (findItem(id) || { name: id }).name;
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, c]) => escapeHtml(nm(id)) + " (" + c + ")").join(" · ");
  const seen = new Set(Object.values(data.log || {}).flatMap(m => Object.keys(m)));
  const idle = (data.items.nucleo || []).filter(x => !seen.has(x.id)).slice(0, 6).map(x => escapeHtml(x.name)).join(", ");
  const lv = [["Busca", motorBusca], ["Números", motorNumeros], ["Memoria", motorMemoria], ["Letras", motorLetras]].map(([k, m]) => k + " " + m.getNivel()).join(" · ");
  return `<b>Informe de los últimos 7 días</b><ul style="margin:6px 0 0 18px"><li>${n} toques en total.</li><li>Más usadas: ${top}.</li>` +
    (idle ? `<li>Núcleo sin usar en 60 días: ${idle}. Valora practicarlas juntos.</li>` : "") +
    `<li>Nivel en juegos: ${lv}. Balones hoy: ${ballsDay.n} · total: ${gameBalls}.</li></ul><div class="mini">Son datos orientativos; los cambios los decides tú.</div>`;
}
const _renderInsights = renderInsights;
renderInsights = function () { _renderInsights(); const b = document.getElementById("weeklyBox"); if (b) b.innerHTML = weekReport(); };

/* ---------- Exportar / borrar lo aprendido ---------- */
exportData = function () {
  const blob = new Blob([JSON.stringify({ data, diary, favorites, profile, balls: gameBalls, version: 7 }, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "datos_matia.json"; a.click();
};
async function deleteLearning() {
  if (!confirm("¿Borrar lo que MatIA ha aprendido del uso (predicción, estadísticas y registro semanal)? Fotos, vocabulario, diario y favoritas no se tocan.")) return;
  data.usage = {}; data.sequences = {}; data.tri = {}; data.log = {}; prevRealId = null;
  await saveData(); renderPredictions(); renderStats(); renderInsights(); alert("Aprendizaje borrado.");
}

importData = function (ev) {
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => (async () => {
    try {
      const obj = JSON.parse(reader.result);
      if (obj.data) { data = mergeWithDefaults(obj.data); await saveData(); }
      if (obj.diary) { diary = obj.diary; await saveDiaryData(diary); }
      if (Array.isArray(obj.favorites)) { favorites = obj.favorites; await saveFavoritesData(favorites); }
      if (obj.profile) { profile = Object.assign(JSON.parse(JSON.stringify(DEFAULT_PROFILE)), obj.profile); await saveProfileData(); }
      if (typeof obj.balls === "number") { gameBalls = Math.max(gameBalls, obj.balls); await saveGameBalls(); }
      renderTabs(); fillEditorCats(); renderItems(); renderPredictions(); showDiary(); renderEditorList(); renderFavorites(); renderBallCounter();
      alert("Datos importados.");
    } catch (e) { alert("No se pudo importar el archivo."); }
  })();
  reader.readAsText(file);
};

/* ---------- Actualización automática (service worker) ---------- */
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
