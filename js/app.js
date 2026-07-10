/* ============================================================
   app.js — Arranque de la aplicación. Declara el estado global
   y conecta los eventos. Se carga el último, después de que
   todas las demás piezas (data.js, storage.js, speech.js,
   scan.js, arasaac.js, ui.js) ya existen.
   ============================================================ */

let mode = localStorage.getItem("jesus_mode") || "school";
let activeCat = "nucleo";
let sentence = [];
let lastIntent = null;
let lastRealId = null;
let photoBuffer = "";
let editingId = null;
let data = JSON.parse(JSON.stringify(DEFAULT_DATA));
let diary = [];
let profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
let settings = loadSettings();
let caregiverMode = false;

function init() {
  (async () => {
    data = await loadData();
    diary = await loadDiary();
    profile = await loadProfile();
    const routineMode = detectRoutineMode(profile, new Date());
    if (routineMode) mode = routineMode;
    renderTabs(); fillEditorCats(); setMode(mode, false); renderItems(); renderSentence(); renderEditorList();
    applySettings();
    updateCaregiverUI();
    setupCaregiverLongPress();
    initSpeech();
    await initGame();

    document.addEventListener("visibilitychange", () => { if (document.hidden && caregiverMode) exitCaregiverMode(); });

    document.getElementById("editPhoto").addEventListener("change", handlePhoto);
    document.getElementById("editPhotoCamera").addEventListener("change", handlePhoto);
    document.getElementById("importFile").addEventListener("change", importData);
    document.getElementById("sizeSelect").addEventListener("change", e => { settings.scale = parseFloat(e.target.value); saveSettings(); applySettings(); });
    document.getElementById("colsSelect").addEventListener("change", e => { settings.cols = parseInt(e.target.value); saveSettings(); applySettings(); });
    document.getElementById("scanSpeedRange").addEventListener("input", e => { settings.scanSpeed = parseInt(e.target.value); saveSettings(); if (scanMode) restartScan(); });
    document.getElementById("rateRange").addEventListener("input", e => { settings.rate = parseFloat(e.target.value); saveSettings(); });
    document.getElementById("voiceSelect").addEventListener("change", e => { settings.voiceURI = e.target.value; saveSettings(); });
    document.addEventListener("keydown", e => { if (scanMode && e.code === "Space") { e.preventDefault(); scanSelect(); } });

    setupSwipeCategories();
    setTimeout(friendTalk, 600);

    setInterval(() => {
      if (caregiverMode) return;
      const rm = detectRoutineMode(profile, new Date());
      if (rm && rm !== mode) setMode(rm, false);
    }, 5 * 60 * 1000);
  })();
}

init();
