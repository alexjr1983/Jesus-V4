/* ============================================================
   pixabay.js — Búsqueda de fotos reales (comidas, deportes,
   objetos cotidianos...) usando la API gratuita de Pixabay.
   Complementa a ARASAAC (pictogramas) para cuando lo que hace
   falta es una foto real y reconocible en vez de un dibujo.

   La clave de la API se pide gratis en https://pixabay.com/api/docs/
   y se guarda solo en este dispositivo (Ajustes → Amigo IA y claves),
   nunca en el código del repositorio público.
   ============================================================ */

async function fetchPixabay(q, lang) {
  const url = "https://pixabay.com/api/?key=" + encodeURIComponent(settings.pixabayApiKey)
    + "&q=" + encodeURIComponent(q) + "&lang=" + lang + "&image_type=photo&safesearch=true&order=popular&per_page=12";
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.hits || [];
}

async function searchPixabay() {
  const q = document.getElementById("pixabayQuery").value.trim();
  const box = document.getElementById("pixabayResults");
  if (!q) return;
  if (!settings.pixabayApiKey) {
    box.innerHTML = '<div class="mini">Falta la clave de Pixabay. Ve a Ajustes del cuidador y pega tu clave gratuita (pixabay.com/api/docs).</div>';
    return;
  }
  box.innerHTML = '<div class="mini">Buscando fotos...</div>';
  try {
    let hits = await fetchPixabay(q, "es");
    if (hits === null) {
      box.innerHTML = '<div class="mini">Pixabay no respondió bien. Revisa que la clave sea correcta.</div>';
      return;
    }
    /* El catálogo en inglés es mucho más amplio y suele dar fotos más
       "normales" y reconocibles. Si en español salen pocas, se completa
       también con inglés (sin duplicar las mismas fotos). */
    if (hits.length < 6) {
      const hitsEn = await fetchPixabay(q, "en");
      if (hitsEn) {
        const known = new Set(hits.map(h => h.id));
        hits = hits.concat(hitsEn.filter(h => !known.has(h.id)));
      }
    }
    if (!hits.length) {
      box.innerHTML = '<div class="mini">Sin resultados. Prueba con otra palabra (en español o inglés).</div>';
      return;
    }
    box.dataset.pixabayIndex = JSON.stringify(hits.slice(0, 12).map(h => h.webformatURL));
    box.innerHTML = hits.slice(0, 12).map((h, idx) => `
      <button type="button" class="cardbtn" style="min-height:80px;padding:4px" onclick="pickPixabay(${idx}, this)">
        <img src="${h.previewURL}" style="width:100%;height:56px;object-fit:cover">
      </button>`).join("");
  } catch (e) {
    box.innerHTML = '<div class="mini">No se pudo conectar con Pixabay. Revisa la conexión e inténtalo otra vez.</div>';
  }
}

/* Descarga la foto elegida y la convierte a base64 (igual que las
   fotos de cámara/galería), para que quede guardada en el móvil y
   funcione también sin conexión — no se deja como enlace externo. */
async function pickPixabay(idx, btn) {
  const box = document.getElementById("pixabayResults");
  const urls = JSON.parse(box.dataset.pixabayIndex || "[]");
  const imgUrl = urls[idx];
  if (!imgUrl) return;
  if (btn) btn.innerHTML = '<span class="mini">Descargando...</span>';
  try {
    const res = await fetch(imgUrl);
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    photoBuffer = dataUrl;
  } catch (e) {
    // Si la descarga falla (p.ej. CORS o sin conexión), se deja el enlace
    // directo como alternativa, aunque entonces necesitará internet para verse.
    photoBuffer = imgUrl;
  }
  const pv = document.getElementById("photoPreview");
  pv.src = photoBuffer;
  box.innerHTML = "";
  document.getElementById("pixabayQuery").value = "";
}
