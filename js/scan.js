/* ============================================================
   scan.js — Modo de barrido (accesibilidad para control motor
   reducido / pulsadores-switch). Ilumina botones uno a uno;
   seleccionar con el botón ✅ o la barra espaciadora.
   ============================================================ */

let scanMode = false, scanTimer = null, scanIndex = -1, scanTargets = [];

function toggleScan() {
  scanMode = !scanMode;
  document.getElementById("scanBtn").textContent = scanMode ? "🔄 Barrido: ON" : "🔄 Barrido: OFF";
  document.getElementById("scanSelectBtn").classList.toggle("hidden", !scanMode);
  if (scanMode) restartScan(); else stopScan();
}
function stopScan() {
  clearInterval(scanTimer); scanTimer = null;
  scanTargets.forEach(el => el.classList.remove("scan-active"));
  scanIndex = -1; scanTargets = [];
}
function restartScan() {
  stopScan();
  if (!scanMode) return;
  scanTargets = Array.from(document.querySelectorAll(
    "#items .cardbtn,#predictions .cardbtn,#tabs .tab,.bottom .inner button"
  ));
  if (!scanTargets.length) return;
  scanIndex = 0;
  scanTargets[0].classList.add("scan-active");
  scanTimer = setInterval(() => {
    scanTargets[scanIndex].classList.remove("scan-active");
    scanIndex = (scanIndex + 1) % scanTargets.length;
    scanTargets[scanIndex].classList.add("scan-active");
  }, settings.scanSpeed);
}
function scanSelect() {
  if (!scanMode || scanIndex < 0 || !scanTargets[scanIndex]) return;
  const el = scanTargets[scanIndex];
  stopScan();
  el.click();
  setTimeout(() => { scanMode = true; restartScan(); }, 400);
}
