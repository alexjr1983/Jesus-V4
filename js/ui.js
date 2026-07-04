/* ============================================================
   ui.js — Todo lo que se dibuja en pantalla: pestañas, tarjetas,
   frase, diario, editor. No decide cómo se guardan los datos
   (eso es storage.js), solo los muestra y reacciona al toque.
   ============================================================ */

function applySettings() {
  document.body.style.setProperty("--scale", settings.scale);
  document.body.classList.toggle("contrast", settings.contrast);
  document.getElementById("contrastBtn").textContent = settings.contrast ? "🌓 Alto contraste: ON" : "🌓 Alto contraste: OFF";
  document.getElementById("sizeSelect").value = settings.scale;
  document.getElementById("colsSelect").value = settings.cols;
  document.getElementById("scanSpeedRange").value = settings.scanSpeed;
  document.getElementById("rateRange").value = settings.rate;
  document.getElementById("aiEnabledCheck").checked = !!settings.aiEnabled;
  document.getElementById("aiApiKeyInput").value = settings.aiApiKey || "";
  const cols = "repeat(" + settings.cols + ", minmax(0,1fr))";
  document.getElementById("items").style.gridTemplateColumns = cols;
  document.getElementById("predictions").style.gridTemplateColumns = cols;
}
function toggleContrast() { settings.contrast = !settings.contrast; saveSettings(); applySettings(); }

/* ---------- Modificadores de frase (constructor multi-slot ligero) ----------
   Tras elegir una rama con objeto final (ej. Beber -> Agua), se ofrecen
   1-2 toques opcionales de "con quién" / "dónde", en vez de una sola palabra suelta. */
let awaitingModifiers = false;
let modifierRegistry = {};
function topUsed(catId, n) {
  const list = data.items[catId] || [];
  return [...list].sort((a, b) => (data.usage[b.id] || 0) - (data.usage[a.id] || 0)).slice(0, n);
}
function withPrefix(item, prefix) {
  if (!item) return null;
  const modId = "mod_" + prefix + "_" + item.id;
  const modItem = { ...item, id: modId, name: prefix + " " + item.name, speech: prefix + " " + (item.speech || item.name).toLowerCase(), _baseId: item.id };
  modifierRegistry[modId] = modItem;
  return modItem;
}

function setMode(m, talk = true) {
  mode = m; localStorage.setItem("jesus_mode", m);
  document.getElementById("schoolBtn").classList.toggle("active", m === "school");
  document.getElementById("homeBtn").classList.toggle("active", m === "home");
  document.getElementById("badBtn").classList.toggle("active", m === "bad");
  renderPredictions();
  if (talk) friendTalk();
}
function friendTalk() {
  const hour = new Date().getHours();
  let text = "Hola Jesús. ";
  if (mode === "school") text += hour < 14 ? "Hoy toca colegio. ¿Cómo estás esta mañana?" : "Hoy has tenido colegio. ¿Quieres contar qué ha pasado?";
  if (mode === "home") text += "Hoy es día de casa o descanso. ¿Qué te apetece hacer?";
  if (mode === "bad") text += "Veo que puede ser un día difícil. Puedes decirme si te duele algo o si estás nervioso.";
  setAI(text); speak(text);
}

/* ---------- Frase ---------- */
function renderSentence() {
  const box = document.getElementById("sentence");
  if (sentence.length === 0) { box.innerHTML = '<span class="small">Toca pictos o fotos para construir la frase.</span>'; return; }
  box.innerHTML = sentence.map(x => tokenHTML(x)).join("");
}
function tokenHTML(x) {
  const media = x.photo ? `<img src="${x.photo}">` : x.icon;
  return `<div class="token"><div class="pic">${media}</div><div class="txt">${escapeHtml(x.name)}</div></div>`;
}
function addToken(item) {
  if (item.action && item.action.startsWith("open:")) {
    addToken({ ...item, action: "" });
    setActiveCat(item.action.split(":")[1]);
    return;
  }
  if (item.action && item.action.startsWith("branch:")) {
    const targetCat = item.action.split(":")[1] || null;
    addToken({ ...item, action: "" });
    lastIntent = null;
    if (targetCat) { awaitingModifiers = true; setActiveCat(targetCat); }
    renderPredictions();
    return;
  }
  if (item.id) {
    data.usage = data.usage || {};
    const usageId = item._baseId || item.id;
    data.usage[usageId] = (data.usage[usageId] || 0) + 1;
    saveData();
  }
  if (item.action === "want") {
    sentence.push(item); lastIntent = "want"; renderSentence(); renderPredictions(); return;
  }
  sentence.push(item);
  if (awaitingModifiers) { awaitingModifiers = false; lastIntent = "afterPick"; }
  else if (lastIntent === "afterPick") { lastIntent = null; }
  renderSentence(); renderPredictions();
}
async function speakSentence() {
  const text = sentence.map(x => x.speech || x.name).join(" ");
  if (!text.trim()) return;
  speak(text);
  const fallback = "Muy bien, Jesús. Ahora dilo tú también: " + text;
  setTimeout(async () => {
    const aiReply = await askAiCompanion(text);
    if (aiReply) { setAI(aiReply); speak(aiReply); }
    else { setAI(fallback); speak("Ahora dilo tú"); }
  }, 1600);
}
function removeLast() { sentence.pop(); renderSentence(); renderPredictions(); }
function clearSentence() { sentence = []; lastIntent = null; awaitingModifiers = false; renderSentence(); renderPredictions(); }

/* ---------- Categorías / tarjetas ---------- */
function renderTabs() {
  document.getElementById("tabs").innerHTML = data.cats.map(c => `
    <button class="tab ${c.id === activeCat ? 'active' : ''}" onclick="setActiveCat('${c.id}')">
      <div class="emoji">${c.icon}</div><div class="label">${c.name}</div>
    </button>`).join("");
  restartScan();
}
function setActiveCat(id) { activeCat = id; renderTabs(); renderItems(); }
function setActiveCatBySwipe(id) { if (navigator.vibrate) navigator.vibrate(12); setActiveCat(id); }
function renderItems() {
  const list = data.items[activeCat] || [];
  document.getElementById("items").innerHTML = list.map(item => cardHTML(item)).join("");
  restartScan();
}
function cardHTML(item, cls = "") {
  const media = item.photo ? `<img src="${item.photo}">` : item.icon;
  return `<button class="cardbtn ${cls}" onclick='addById("${item.id}")'>
    <div class="emoji">${media}</div><div class="label">${escapeHtml(item.name)}</div>
    <div class="sub">${escapeHtml(item.speech || "")}</div></button>`;
}
function findItem(id) {
  if (modifierRegistry[id]) return modifierRegistry[id];
  for (const cat of Object.keys(data.items)) {
    const found = data.items[cat].find(x => x.id === id);
    if (found) return found;
  }
  if (data.intents) {
    for (const key of Object.keys(data.intents)) {
      const found = data.intents[key].find(x => x.id === id);
      if (found) return found;
    }
  }
}
function addById(id) { const item = findItem(id); if (item) { if (navigator.vibrate) navigator.vibrate(10); addToken(item); } }
function renderPredictions() {
  let picks = [];
  const hour = new Date().getHours();
  if (lastIntent === "want" && data.intents && data.intents.want) picks = data.intents.want;
  else if (lastIntent === "afterPick") {
    picks = [...topUsed("personas", 2).map(x => withPrefix(x, "con")), ...topUsed("lugares", 2).map(x => withPrefix(x, "en"))];
  }
  else if (mode === "bad") picks = [findItem("mal"), findItem("nervioso"), findItem("cansado"), findItem("cabeza"), findItem("ayuda")];
  else if (mode === "school") {
    picks = hour < 15 ? [findItem("colegio"), findItem("erik"), findItem("profesor"), findItem("autobus"), findItem("contento")] :
      [findItem("he_colegio"), findItem("erik"), findItem("cansado"), findItem("petit"), findItem("papa")];
  } else {
    picks = [findItem("mama"), findItem("papa"), findItem("diego"), findItem("pasear"), findItem("jugar")];
  }
  picks = picks.filter(Boolean);
  document.getElementById("predictions").innerHTML = picks.map(x => cardHTML(x, "pred")).join("");
  restartScan();
}
function smartStart(kind) {
  clearSentence();
  if (kind === "wantEat") { sentence.push(findItem("quiero")); setActiveCat("comidas"); setAI("Vale Jesús. Elige qué quieres comer."); speak("Vale Jesús. Elige qué quieres comer."); }
  if (kind === "wantGo") { sentence.push(findItem("quiero")); sentence.push({ name: "ir", speech: "ir", icon: "🚗" }); setActiveCat("lugares"); setAI("Vale Jesús. Elige a dónde quieres ir."); speak("Vale Jesús. Elige a dónde quieres ir."); }
  if (kind === "wantPerson") { sentence.push(findItem("quiero")); sentence.push({ name: "estar con", speech: "estar con", icon: "👨‍👩‍👦" }); setActiveCat("personas"); setAI("Vale Jesús. Elige con quién quieres estar."); speak("Vale Jesús. Elige con quién quieres estar."); }
  renderSentence(); renderPredictions();
}
function showHelp() {
  setActiveCat("dolor");
  setAI("No pasa nada, Jesús. Vamos despacio. ¿Es dolor, emoción, persona, lugar o comida?");
  speak("No pasa nada, Jesús. Vamos despacio. ¿Es dolor, emoción, persona, lugar o comida?");
}
function openToday() {
  setActiveCat("actividades");
  setAI("Jesús, vamos a contar el día. Toca fotos o pictos de lo que has hecho hoy.");
  speak("Jesús, vamos a contar el día. Toca fotos o pictos de lo que has hecho hoy.");
}

/* ---------- Diario ---------- */
async function saveDiary() {
  if (sentence.length === 0) return;
  diary.unshift({ date: new Date().toLocaleString("es-ES"), items: sentence, text: sentence.map(x => x.speech || x.name).join(" ") });
  diary = diary.slice(0, 50);
  await saveDiaryData(diary);
  setAI("Guardado en el diario.");
  speak("Guardado en el diario.");
  showDiary();
}
function showDiary() {
  const box = document.getElementById("diaryBox");
  if (!diary.length) { box.innerHTML = "Aún no hay frases guardadas."; return; }
  box.innerHTML = diary.slice(0, 8).map(d => `<div class="panel"><b>${d.date}</b><br>${escapeHtml(d.text)}<div class="sentence">${d.items.map(tokenHTML).join("")}</div></div>`).join("");
}
async function clearDiary() {
  if (confirm("¿Borrar el diario de este navegador?")) { diary = []; await saveDiaryData(diary); showDiary(); }
}
function renderStats() {
  const box = document.getElementById("statsBox");
  const usage = data.usage || {};
  const entries = Object.entries(usage).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!entries.length) { box.innerHTML = '<div class="mini">Aún no hay datos de uso.</div>'; return; }
  box.innerHTML = "<b>Más usados:</b> " + entries.map(([id, count]) => {
    const it = findItem(id);
    const label = it ? it.name : id;
    return `${escapeHtml(label)} (${count})`;
  }).join(" · ");
}
function computeDiaryInsights() {
  const emoIds = (data.items.emociones || []).map(x => x.id);
  const co = {};
  diary.forEach(entry => {
    const ids = (entry.items || []).map(x => x.id).filter(Boolean);
    const emosHere = ids.filter(id => emoIds.includes(id));
    emosHere.forEach(emoId => {
      ids.forEach(otherId => {
        if (otherId === emoId || emoIds.includes(otherId)) return;
        co[emoId] = co[emoId] || {};
        co[emoId][otherId] = (co[emoId][otherId] || 0) + 1;
      });
    });
  });
  const insights = [];
  Object.keys(co).forEach(emoId => {
    const emoItem = findItem(emoId); if (!emoItem) return;
    const top = Object.entries(co[emoId]).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      const otherItem = findItem(top[0]);
      if (otherItem) insights.push(`Jesús suele estar ${emoItem.name.toLowerCase()} cuando aparece "${otherItem.name.toLowerCase()}" (visto ${top[1]} veces en el diario).`);
    }
  });
  return insights;
}
function renderInsights() {
  const box = document.getElementById("insightsBox");
  if (!box) return;
  if (diary.length < 3) { box.innerHTML = '<div class="mini">Guarda unas cuantas frases más en el diario para que aparezcan patrones.</div>'; return; }
  const insights = computeDiaryInsights();
  box.innerHTML = insights.length
    ? "<b>Patrones detectados:</b><ul style='margin:6px 0 0 18px'>" + insights.map(t => `<li>${escapeHtml(t)}</li>`).join("") + "</ul>"
    : '<div class="mini">Aún no hay un patrón claro y repetido. Sigue guardando frases en el diario.</div>';
}

/* ---------- Editor: añadir / editar / borrar ---------- */
function fillEditorCats() {
  document.getElementById("editCat").innerHTML = data.cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("");
}
function handlePhoto(ev) {
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { photoBuffer = reader.result; document.getElementById("photoPreview").src = photoBuffer; };
  reader.readAsDataURL(file);
}
function addOrUpdateItem() {
  const cat = document.getElementById("editCat").value;
  const name = document.getElementById("editName").value.trim();
  const speech = document.getElementById("editSpeech").value.trim() || name;
  const icon = document.getElementById("editEmoji").value.trim() || "⭐";
  if (!name) { alert("Escribe un nombre."); return; }
  const id = editingId || slug(name);
  const item = { id, name, speech, icon, photo: photoBuffer, action: "" };
  const arr = data.items[cat] ||= [];
  const idx = arr.findIndex(x => x.id === id);
  if (idx >= 0) arr[idx] = { ...arr[idx], ...item };
  else arr.push(item);
  saveData(); photoBuffer = ""; editingId = null;
  document.getElementById("editName").value = ""; document.getElementById("editSpeech").value = "";
  document.getElementById("editEmoji").value = ""; document.getElementById("editPhoto").value = "";
  document.getElementById("photoPreview").removeAttribute("src");
  document.getElementById("arasaacResults").innerHTML = "";
  renderItems(); renderPredictions(); renderEditorList();
  setAI("Elemento guardado. Ya puedes usarlo.");
  speak("Elemento guardado.");
}
function cancelEdit() {
  editingId = null; photoBuffer = "";
  document.getElementById("editName").value = ""; document.getElementById("editSpeech").value = "";
  document.getElementById("editEmoji").value = ""; document.getElementById("editPhoto").value = "";
  document.getElementById("photoPreview").removeAttribute("src");
  document.getElementById("arasaacResults").innerHTML = "";
}
function renderEditorList() {
  const cat = document.getElementById("editCat").value;
  const list = data.items[cat] || [];
  const box = document.getElementById("editorList");
  if (!box) return;
  box.innerHTML = list.map(it => {
    const media = it.photo ? `<img class="thumb" src="${it.photo}">` : it.icon;
    return `<div class="itemRow">
      <span class="name">${media} ${escapeHtml(it.name)}</span>
      <span class="row">
        <button class="miniBtn" onclick="editItem('${cat}','${it.id}')">✏️</button>
        <button class="miniBtn danger" onclick="deleteItem('${cat}','${it.id}')">🗑️</button>
      </span>
    </div>`;
  }).join("") || '<div class="mini">Sin elementos aún en esta categoría.</div>';
}
function editItem(cat, id) {
  const it = (data.items[cat] || []).find(x => x.id === id); if (!it) return;
  document.getElementById("editCat").value = cat;
  document.getElementById("editName").value = it.name;
  document.getElementById("editSpeech").value = it.speech;
  document.getElementById("editEmoji").value = it.icon;
  photoBuffer = it.photo || "";
  editingId = id;
  const pv = document.getElementById("photoPreview");
  if (photoBuffer) pv.src = photoBuffer; else pv.removeAttribute("src");
}
function deleteItem(cat, id) {
  if (!confirm("¿Eliminar este elemento?")) return;
  data.items[cat] = (data.items[cat] || []).filter(x => x.id !== id);
  saveData(); renderItems(); renderEditorList(); renderPredictions();
}

/* ---------- Exportar / importar ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ data, diary }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "datos_comunicador_jesus.json"; a.click();
}
function importClick() { document.getElementById("importFile").click(); }
function importData(ev) {
  const file = ev.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    (async () => {
      try {
        const obj = JSON.parse(reader.result);
        if (obj.data) { data = obj.data; data.usage = data.usage || {}; await saveData(); }
        if (obj.diary) { diary = obj.diary; await saveDiaryData(diary); }
        renderTabs(); fillEditorCats(); renderItems(); renderPredictions(); showDiary(); renderEditorList();
        alert("Datos importados.");
      } catch (e) { alert("No se pudo importar el archivo."); }
    })();
  };
  reader.readAsText(file);
}

/* ---------- Modo Cuidador ----------
   Pulsación larga (1.8s) sobre el candado + PIN familiar.
   Bloquea edición, ajustes y diario para que el modo normal
   de Jesús sea siempre simple e imposible de romper sin querer. */
const CAREGIVER_SHEET_IDS = ["accessPanel", "diaryPanel", "editorPanel"];
function openSheet(id) {
  if (!caregiverMode) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("open");
  if (id === "editorPanel") { fillEditorCats(); renderEditorList(); }
  if (id === "diaryPanel") { showDiary(); renderStats(); renderInsights(); }
  if (navigator.vibrate) navigator.vibrate(15);
}
function closeSheet(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}
function updateCaregiverUI() {
  if (!caregiverMode) CAREGIVER_SHEET_IDS.forEach(closeSheet);
  const bar = document.getElementById("caregiverBar");
  if (bar) bar.classList.toggle("hidden", !caregiverMode);
  const lockBtn = document.getElementById("caregiverLockBtn");
  if (lockBtn) lockBtn.textContent = caregiverMode ? "🔓" : "🔒";
}
function setupCaregiverLongPress() {
  const btn = document.getElementById("caregiverLockBtn");
  if (!btn) return;
  let timer = null;
  const start = (e) => {
    if (e.cancelable) e.preventDefault();
    btn.classList.add("pressing");
    timer = setTimeout(() => { btn.classList.remove("pressing"); requestCaregiverToggle(); }, 1800);
  };
  const cancel = () => { btn.classList.remove("pressing"); if (timer) { clearTimeout(timer); timer = null; } };
  btn.addEventListener("touchstart", start, { passive: false });
  btn.addEventListener("touchend", cancel);
  btn.addEventListener("touchcancel", cancel);
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", cancel);
  btn.addEventListener("mouseleave", cancel);
}
function requestCaregiverToggle() {
  if (caregiverMode) { exitCaregiverMode(); return; }
  enterCaregiverMode();
}
function enterCaregiverMode() {
  if (!settings.pin) {
    const p1 = prompt("Primera vez: crea un PIN de 4 a 8 dígitos para el Modo Cuidador.");
    if (!p1) return;
    const p2 = prompt("Repite el PIN para confirmarlo.");
    if (!/^\d{4,8}$/.test(p1) || p1 !== p2) { alert("Los PIN no coinciden o no son válidos (4-8 dígitos)."); return; }
    settings.pin = p1; saveSettings();
    alert("PIN creado. Guárdalo en un lugar seguro.");
  }
  const entered = prompt("PIN del Modo Cuidador:");
  if (entered === null) return;
  if (entered !== settings.pin) { alert("PIN incorrecto."); return; }
  caregiverMode = true;
  updateCaregiverUI();
  fillEditorCats(); renderEditorList();
  if (navigator.vibrate) navigator.vibrate(80);
}
function exitCaregiverMode() {
  caregiverMode = false;
  updateCaregiverUI();
}
function changePin() {
  if (settings.pin) {
    const current = prompt("PIN actual:");
    if (current !== settings.pin) { alert("PIN incorrecto."); return; }
  }
  const p1 = prompt("Nuevo PIN (4-8 dígitos):");
  if (!p1 || !/^\d{4,8}$/.test(p1)) { alert("PIN no válido."); return; }
  const p2 = prompt("Repite el nuevo PIN:");
  if (p1 !== p2) { alert("Los PIN no coinciden."); return; }
  settings.pin = p1; saveSettings();
  alert("PIN actualizado.");
}

/* ---------- Amigo IA conversacional (opcional) ----------
   Apagado por defecto. Solo se activa si la familia, desde Modo
   Cuidador, lo activa y pega su propia clave de la API de Anthropic.
   Si no está activo, o si falla la conexión, la app sigue funcionando
   con las respuestas fijas de friendTalk() de siempre. */
async function askAiCompanion(promptText) {
  if (!settings.aiEnabled || !settings.aiApiKey) return null;
  try {
    const recentDiary = diary.slice(0, 5).map(d => d.text).join(" | ") || "sin datos aún";
    const system = "Eres un amigo digital cercano de Jesús, una persona con discapacidad intelectual que no sabe leer y se comunica sobre todo con pictogramas y frases muy cortas. Responde SIEMPRE en español de España, en una sola frase muy corta y sencilla (máximo 12 palabras), cálida y positiva, sin tecnicismos. Cuando tenga sentido, anímale con una pregunta muy simple a decirlo también él mismo con su voz, no solo tocando pictos.";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.aiApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 150,
        system,
        messages: [{ role: "user", content: `Diario reciente: ${recentDiary}. Jesús acaba de decir: "${promptText}".` }]
      })
    });
    if (!res.ok) { console.warn("Amigo IA: respuesta no válida", res.status); return null; }
    const json = await res.json();
    const text = (json.content || []).map(c => c.text || "").join(" ").trim();
    return text || null;
  } catch (e) { console.warn("Amigo IA: sin conexión o error.", e); return null; }
}
function toggleAiEnabled() {
  settings.aiEnabled = document.getElementById("aiEnabledCheck").checked;
  saveSettings();
}
function saveAiKey() {
  settings.aiApiKey = document.getElementById("aiApiKeyInput").value.trim();
  saveSettings();
  alert("Clave guardada solo en este dispositivo.");
}

/* ---------- Gesto: deslizar para cambiar de categoría ----------
   Además de tocar la pestaña, deslizar sobre la cuadrícula de tarjetas
   avanza/retrocede entre categorías, como un carrusel de app real. */
function setupSwipeCategories() {
  const el = document.getElementById("items");
  if (!el) return;
  let startX = 0, startY = 0, tracking = false;
  el.addEventListener("touchstart", e => {
    if (e.touches.length !== 1 || scanMode) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; tracking = true;
  }, { passive: true });
  el.addEventListener("touchend", e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const idx = data.cats.findIndex(c => c.id === activeCat);
      let next = dx < 0 ? idx + 1 : idx - 1;
      if (next < 0) next = data.cats.length - 1;
      if (next >= data.cats.length) next = 0;
      setActiveCatBySwipe(data.cats[next].id);
    }
  }, { passive: true });
}

/* ---------- Utilidades ---------- */
function slug(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_" + Date.now().toString(36);
}
function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
