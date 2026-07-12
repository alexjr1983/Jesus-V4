/* ============================================================
   game.js — Juego "¿Qué busca MatIA?"

   MatIA nombra en voz alta un picto que Jesús ya conoce; Jesús
   tiene que encontrarlo entre varias opciones de su misma
   categoría (mismo color, para no romper el código visual del
   resto de la app). Cada acierto:
     1) celebra con MatIA (rebote + confeti ligero + sonido),
     2) suma un balón a su colección, que se guarda para siempre.

   No hay fallos "malos": si se equivoca, MatIA anima a seguir
   intentándolo. Tras dos fallos en la misma ronda, se resalta la
   respuesta correcta en vez de dejar a Jesús atascado.

   No usa el motor de predicción ni el diario: es un modo aparte,
   pensado para practicar reconocimiento de pictos, no para
   construir frases reales.
   ============================================================ */

const MASCOT_NAME = "MatIA";
const GAME_EXCLUDED_CATS = ["dolor"]; // vocabulario de dolor/cuerpo fuera del juego, a propósito

/* Mismo patrón que gamesCore/numerosGame: varias frases de refuerzo
   alternando al azar, en vez de repetir siempre la misma, para que
   no se vuelva predecible ni "de máquina". */
const GAME_FRASES_REFUERZO = ["🎉 ¡Muy bien!", "🎉 ¡Bravo!", "🎉 ¡Genial!", "🎉 ¡Eso es!", "🎉 ¡Perfecto!"];
function fraseRefuerzoAleatoria() {
  return GAME_FRASES_REFUERZO[Math.floor(Math.random() * GAME_FRASES_REFUERZO.length)];
}

let gameBalls = 0;
let gameRound = null;   // { catId, targetId, optionIds }
let gameMisses = 0;
let gameLocked = false;

/* ---------- Balones: se guardan igual que el diario (IndexedDB con
   respaldo en localStorage), nunca se restan, solo suman. ---------- */
async function loadGameBalls() {
  try { const v = await idbGet("game_balls"); if (typeof v === "number") return v; } catch (e) {}
  try { const old = localStorage.getItem("jesus_game_balls"); if (old) return parseInt(old, 10) || 0; } catch (e) {}
  return 0;
}
async function saveGameBalls() {
  try { await idbSet("game_balls", gameBalls); }
  catch (e) { try { localStorage.setItem("jesus_game_balls", String(gameBalls)); } catch (e2) {} }
}
async function initGame() {
  gameBalls = await loadGameBalls();
  renderBallCounter();
}
function renderBallCounter() {
  const a = document.getElementById("ballCounter");
  if (a) a.textContent = "🏀 " + gameBalls;
  const b = document.getElementById("gameBallCounter");
  if (b) b.textContent = "🏀 " + gameBalls;
}
function pulseBallCounter() {
  ["ballCounter", "gameBallCounter"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("ballPulse");
    void el.offsetWidth; // reinicia la animación aunque se repita seguido
    el.classList.add("ballPulse");
  });
}

/* ---------- Elegir una ronda: categoría con vocabulario suficiente,
   objetivo priorizando palabras que Jesús ya ha usado alguna vez
   (para que el juego refuerce vocabulario real, no al azar total). ---------- */
function pickGameCategory() {
  const eligible = data.cats.filter(c =>
    !GAME_EXCLUDED_CATS.includes(c.id) && (data.items[c.id] || []).length >= 4
  );
  if (!eligible.length) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}
function pickTarget(cat) {
  const list = data.items[cat.id] || [];
  const used = list.filter(x => (data.usage[x.id] || 0) > 0);
  const pool = used.length ? used : list;
  return pool[Math.floor(Math.random() * pool.length)];
}
function shuffleArray(arr) {
  for (let idx = arr.length - 1; idx > 0; idx--) {
    const j = Math.floor(Math.random() * (idx + 1));
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
  }
  return arr;
}
function buildRound() {
  const cat = pickGameCategory();
  if (!cat) return null;
  const list = data.items[cat.id] || [];
  const target = pickTarget(cat);
  if (!target) return null;
  const distractors = shuffleArray(list.filter(x => x.id !== target.id)).slice(0, 3);
  const options = shuffleArray([target, ...distractors]);
  return { catId: cat.id, targetId: target.id, optionIds: options.map(o => o.id) };
}

/* ---------- Tarjetas del juego: mismo color por categoría que el
   resto de la app, pero sin el subtítulo de voz (aquí interesa que
   Jesús reconozca el picto, no que lea el texto). ---------- */
function gameCardHTML(item, type) {
  const media = item.photo ? `<img src="${item.photo}">` : item.icon;
  return `<button class="cardbtn cat-${type} gameCard" data-id="${item.id}" onclick="gamePick('${item.id}')">
    <div class="emoji">${media}</div><div class="label">${escapeHtml(item.name)}</div></button>`;
}

/* ---------- Abrir / cerrar el juego.
   A propósito NO pasa por openSheet(): ese requiere Modo Cuidador,
   y este juego es justo lo contrario, para que lo use Jesús solo. ---------- */
function openGame() {
  const el = document.getElementById("gamePanel");
  if (!el) return;
  el.classList.add("open");
  if (navigator.vibrate) navigator.vibrate(15);
  nextGameRound();
}
function closeGame() {
  const el = document.getElementById("gamePanel");
  if (el) el.classList.remove("open");
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}
function nextGameRound() {
  gameMisses = 0;
  gameLocked = false;
  gameRound = buildRound();
  const board = document.getElementById("gameBoard");
  const bubble = document.getElementById("gameBubble");
  if (!gameRound) {
    if (bubble) bubble.textContent = MASCOT_NAME + " necesita más vocabulario para jugar. Añade más elementos desde el Editor.";
    if (board) board.innerHTML = "";
    return;
  }
  const target = findItem(gameRound.targetId);
  const cat = data.cats.find(c => c.id === gameRound.catId);
  const prompt = `${MASCOT_NAME} está buscando: ${target.name}. ¿Lo encuentras?`;
  if (bubble) bubble.textContent = "🏀 " + prompt;
  speak(prompt);
  if (board) {
    board.innerHTML = gameRound.optionIds
      .map(id => gameCardHTML(findItem(id), cat ? cat.type : "objeto"))
      .join("");
  }
}
function gamePick(id) {
  if (!gameRound || gameLocked) return;
  const chosenEl = document.querySelector(`#gameBoard .cardbtn[data-id="${id}"]`);
  const correct = id === gameRound.targetId;
  const bubble = document.getElementById("gameBubble");

  if (correct) {
    gameLocked = true;
    if (chosenEl) chosenEl.classList.add("gameCorrect");
    if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
    gameBalls++;
    saveGameBalls();
    renderBallCounter();
    pulseBallCounter();
    celebrateGameWin();
    if (bubble) bubble.textContent = fraseRefuerzoAleatoria() + " Balón conseguido.";
    setTimeout(nextGameRound, 1500);
  } else {
    gameMisses++;
    if (chosenEl) {
      chosenEl.classList.add("gameWrong");
      setTimeout(() => chosenEl.classList.remove("gameWrong"), 450);
    }
    if (navigator.vibrate) navigator.vibrate(8);
    if (gameMisses >= 2) {
      const target = findItem(gameRound.targetId);
      if (bubble) bubble.textContent = "🏀 Está aquí: " + target.name + ". ¡Tócalo!";
      speak("Está aquí, mira");
      const correctEl = document.querySelector(`#gameBoard .cardbtn[data-id="${gameRound.targetId}"]`);
      if (correctEl) correctEl.classList.add("gameHint");
    } else {
      if (bubble) bubble.textContent = "🏀 Casi... ¡prueba otra vez!";
      speak("Prueba otra vez");
    }
  }
}

/* ---------- Celebración de ronda ganada: versión ligera de
   celebrateBig() (companion.js). A propósito NO usa la animación
   grande a pantalla completa (pelota-a-canasta / fuegos), que se
   reserva para el botón manual "Celebrar" de logros importantes.
   Aquí solo un salto del avatar, confeti breve y el mismo acorde. ---------- */
function celebrateGameWin() {
  const avatar = document.getElementById("gameAvatar");
  if (avatar) {
    avatar.classList.add("gameJump");
    setTimeout(() => avatar.classList.remove("gameJump"), 1300);
  }
  celebrateCompanion();
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) spawnConfetti(makeCelebrationOverlay(), 18);
  playCelebrationChime();
}
