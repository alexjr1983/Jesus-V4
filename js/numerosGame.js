/* ============================================================
   numerosGame.js — Juego "Números 1-5"

   Jesús ve una cantidad de objetos y toca el numeral correcto
   entre varias opciones. Usa gamesCore.js para la dificultad
   adaptativa (sube con aciertos seguidos, baja con errores).

   A propósito NO usa openSheet()/closeSheet(): esas funciones
   requieren Modo Cuidador activo (ver ui.js), y este juego es
   justo lo contrario, para que lo use Jesús solo — igual que
   openGame()/closeGame() en game.js.
   ============================================================ */

var OBJETO_A_CONTAR = '🏀';
var motorNumeros = crearMotorDificultad('numeros');
var numeroObjetivoActual = 1;

var FRASES_REFUERZO = ['¡Bien!', '¡Bravo!', '¡Muy bien!', '¡Genial!', '¡Eso es!'];

function reproducirAudioRefuerzo() {
  var frase = FRASES_REFUERZO[Math.floor(Math.random() * FRASES_REFUERZO.length)];
  if (typeof speak === 'function') speak(frase);
  if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
}

/* ---------- Abrir / cerrar el juego ---------- */
function openNumeros() {
  var el = document.getElementById('numerosPanel');
  if (!el) return;
  el.classList.add('open');
  if (navigator.vibrate) navigator.vibrate(15);
  iniciarJuegoNumeros();
}
function closeNumeros() {
  var el = document.getElementById('numerosPanel');
  if (el) el.classList.remove('open');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function numeroAleatorioNumeros(max) {
  return Math.floor(Math.random() * max) + 1;
}

function generarOpcionesNumeros(correcto, maxNumero, cantidad) {
  var set = [correcto];
  while (set.length < cantidad) {
    var candidato = numeroAleatorioNumeros(maxNumero);
    if (set.indexOf(candidato) === -1) set.push(candidato);
  }
  return set.sort(function () { return Math.random() - 0.5; });
}

function renderRondaNumeros(cantidad, opciones) {
  var contenedor = document.getElementById('numeros-juego-contenedor');
  if (!contenedor) return;

  var objetos = '';
  for (var i = 0; i < cantidad; i++) objetos += OBJETO_A_CONTAR + ' ';

  contenedor.innerHTML =
    '<div class="gameAiRow">' +
    '<div class="gameAvatar">🔢</div>' +
    '<div class="aiBubble" id="numerosBubble">¿Cuántos hay?</div>' +
    '</div>' +
    '<div style="font-size:2rem;text-align:center;margin:14px 0">' + objetos + '</div>' +
    '<div id="numerosOpciones" class="grid" style="margin-top:10px"></div>';

  var opcionesDiv = document.getElementById('numerosOpciones');
  opciones.forEach(function (op) {
    var boton = document.createElement('button');
    boton.textContent = op;
    boton.className = 'cardbtn';
    boton.style.fontSize = '1.5rem';
    boton.setAttribute('data-valor', op);
    boton.onclick = function () { manejarRespuestaNumeros(boton); };
    opcionesDiv.appendChild(boton);
  });
}

function manejarRespuestaNumeros(boton) {
  var valorElegido = parseInt(boton.getAttribute('data-valor'), 10);
  var esCorrecto = valorElegido === numeroObjetivoActual;
  var bubble = document.getElementById('numerosBubble');

  if (esCorrecto) {
    motorNumeros.registrarAcierto();
    boton.classList.add('gameCorrect');
    if (bubble) bubble.textContent = '🎉 ¡Correcto!';
    reproducirAudioRefuerzo();
    setTimeout(generarRondaNumeros, 1200);
  } else {
    motorNumeros.registrarError();
    boton.classList.add('gameWrong');
    setTimeout(function () { boton.classList.remove('gameWrong'); }, 450);
  }
}

function generarRondaNumeros() {
  var nivel = motorNumeros.getNivel();
  var maxNumero = nivel === 1 ? 3 : 5;
  numeroObjetivoActual = numeroAleatorioNumeros(maxNumero);
  var cantidadOpciones = opcionesSegunNivel(nivel);
  var opciones = generarOpcionesNumeros(numeroObjetivoActual, maxNumero, cantidadOpciones);
  renderRondaNumeros(numeroObjetivoActual, opciones);
}

function iniciarJuegoNumeros() {
  motorNumeros.reiniciarRachas();
  generarRondaNumeros();
}
