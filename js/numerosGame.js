// numerosGame.js
// Mini-juego "Números 1-5": Jesús ve una cantidad de objetos y toca
// el numeral correcto entre varias opciones. Usa gamesCore.js.
// No toca IndexedDB de fotos ni pictogramas guardados.

var OBJETO_A_CONTAR = '🏀';
var motorNumeros = crearMotorDificultad('numeros');
var numeroObjetivoActual = 1;

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

  var html = '<div class="gameAiRow">' +
    '<div class="gameAvatar">🔢</div>' +
    '<div class="aiBubble">¿Cuántos hay?</div>' +
    '</div>' +
    '<div style="font-size:2rem;text-align:center;margin:14px 0">' + objetos + '</div>' +
    '<div id="numerosOpciones" class="grid" style="margin-top:10px"></div>';

  contenedor.innerHTML = html;

  var opcionesDiv = document.getElementById('numerosOpciones');
  opciones.forEach(function (op) {
    var boton = document.createElement('button');
    boton.textContent = op;
    boton.style.fontSize = '1.5rem';
    boton.setAttribute('data-valor', op);
    boton.onclick = function () { manejarRespuestaNumeros(boton); };
    opcionesDiv.appendChild(boton);
  });
}

function manejarRespuestaNumeros(boton) {
  var valorElegido = parseInt(boton.getAttribute('data-valor'), 10);
  var esCorrecto = valorElegido === numeroObjetivoActual;

  if (esCorrecto) {
    motorNumeros.registrarAcierto();
    if (typeof reproducirAudioRefuerzo === 'function') reproducirAudioRefuerzo();
    setTimeout(generarRondaNumeros, 1200);
  } else {
    motorNumeros.registrarError();
    boton.style.opacity = '0.5';
    setTimeout(function () { boton.style.opacity = '1'; }, 800);
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

// Función global: la llama el botón de "Jugar a Números" en index.html
function iniciarJuegoNumeros() {
  motorNumeros.reiniciarRachas();
  generarRondaNumeros();
}
