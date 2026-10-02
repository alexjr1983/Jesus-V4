/* MatIA — service worker. Red primero (así las actualizaciones llegan solas)
   y caché como respaldo sin conexión. Cambia VERSION en cada entrega. */
const VERSION = "matia-v8";
const CORE = ["./", "index.html", "manifest.json", "css/styles.css",
  "js/data.js", "js/companion.js", "js/storage.js", "js/profile.js", "js/speech.js", "js/scan.js",
  "js/arasaac.js", "js/pixabay.js", "js/ui.js", "js/game.js", "js/gamesCore.js", "js/numerosGame.js",
  "js/matia-extras.js", "js/matia-v8.js", "js/app.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return; // nada externo pasa por aquí
  e.respondWith(fetch(r).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(r, copy)); return res; }).catch(() => caches.match(r)));
});
