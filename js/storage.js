/* ============================================================
   storage.js — Guardado de datos: IndexedDB (más espacio, para
   fotos) con copia de seguridad automática en localStorage.
   Aquí también viven los ajustes (tamaño, contraste, voz...).
   ============================================================ */

const STORAGE_KEY = "comunicador_jesus_next_visual_v1";
const DB_NAME = "jesus_comm_db", STORE = "kv";

function idbOpen() {
  return new Promise((res, rej) => {
    if (!("indexedDB" in window)) { rej(new Error("no-idb")); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const rq = tx.objectStore(STORE).get(key);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function loadData() {
  try {
    const d = await idbGet("data");
    if (d) { d.usage = d.usage || {}; d.intents = d.intents || JSON.parse(JSON.stringify(DEFAULT_DATA.intents)); return d; }
  } catch (e) {}
  try {
    const old = localStorage.getItem(STORAGE_KEY);
    if (old) {
      const parsed = JSON.parse(old);
      parsed.usage = parsed.usage || {};
      parsed.intents = parsed.intents || JSON.parse(JSON.stringify(DEFAULT_DATA.intents));
      idbSet("data", parsed).catch(() => {});
      return parsed;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
async function saveData() {
  data.usage = data.usage || {};
  try { await idbSet("data", data); }
  catch (e) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e2) { console.warn("No se pudo guardar (almacenamiento lleno o no disponible)."); }
  }
}
async function loadDiary() {
  try { const d = await idbGet("diary"); if (d) return d; } catch (e) {}
  try { const old = localStorage.getItem("jesus_diary"); if (old) return JSON.parse(old); } catch (e) {}
  return [];
}
async function saveDiaryData(d) {
  try { await idbSet("diary", d); }
  catch (e) { try { localStorage.setItem("jesus_diary", JSON.stringify(d)); } catch (e2) {} }
}

/* ---------- Ajustes (tamaño, contraste, columnas, voz, barrido) ---------- */
function defaultSettings() {
  return { scale: 1, contrast: false, cols: 4, scanSpeed: 1600, voiceURI: "", rate: 0.9, pin: "", aiEnabled: false, aiApiKey: "" };
}
function loadSettings() {
  try { return Object.assign(defaultSettings(), JSON.parse(localStorage.getItem("jesus_settings") || "{}")); }
  catch (e) { return defaultSettings(); }
}
function saveSettings() { localStorage.setItem("jesus_settings", JSON.stringify(settings)); }
