/* ============================================================
   arasaac.js — Búsqueda de pictogramas reales ARASAAC para
   usar en vez de un emoji. Requiere internet solo al buscar.
   Autor: Sergio Palao. Origen: ARASAAC (Gobierno de Aragón).
   Licencia: CC BY-NC-SA.
   ============================================================ */

async function searchArasaac() {
  const q = document.getElementById("arasaacQuery").value.trim();
  const box = document.getElementById("arasaacResults");
  if (!q) return;
  box.innerHTML = '<div class="mini">Buscando...</div>';
  try {
    const res = await fetch("https://api.arasaac.org/api/pictograms/es/search/" + encodeURIComponent(q));
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) {
      box.innerHTML = '<div class="mini">Sin resultados. Prueba otra palabra.</div>';
      return;
    }
    box.innerHTML = list.slice(0, 12).map(p => `
      <button type="button" class="cardbtn" style="min-height:80px;padding:4px" onclick="pickArasaac(${p._id})">
        <img src="https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png" style="width:100%;height:56px;object-fit:contain">
      </button>`).join("");
  } catch (e) {
    box.innerHTML = '<div class="mini">No se pudo conectar con ARASAAC. Revisa la conexión e inténtalo otra vez.</div>';
  }
}

function pickArasaac(picId) {
  photoBuffer = "https://static.arasaac.org/pictograms/" + picId + "/" + picId + "_300.png";
  const pv = document.getElementById("photoPreview");
  pv.src = photoBuffer;
  document.getElementById("arasaacResults").innerHTML = "";
  document.getElementById("arasaacQuery").value = "";
}
