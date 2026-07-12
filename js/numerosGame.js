/**
 * numerosGame.js
 * Mini-juego "Números 1-5": Jesús ve una cantidad de objetos (pictogramas
 * repetidos, ej. balones 🏀) y debe tocar el numeral correcto entre varias
 * opciones. Usa el motor de dificultad compartido (gamesCore.js).
 *
 * No toca IndexedDB de fotos ni pictogramas guardados: usa un emoji/objeto
 * simple como elemento a contar, configurable abajo.
 *
 * Integración esperada en index.html:
 *   <div id="numeros-juego-contenedor"></div>
 *   <script type="module" src="js/numerosGame.js"></script>
 *
 * Y en el módulo de navegación existente, añadir una entrada de menú que
 * llame a iniciarJuegoNumeros() cuando Jesús seleccione este juego.
 */

import { crearMotorDificultad, opcionesSegunNivel } from './gamesCore.js';

const OBJETO_A_CONTAR = '🏀'; // fácil de cambiar por otro pictograma si se prefiere
const CONTENEDOR_ID = 'numeros-juego-contenedor';

const motor = crearMotorDificultad({ juego: 'numeros' });

let numeroObjetivo = 1;

function numeroAleatorio(max) {
  return Math.floor(Math.random() * max) + 1;
}

function generarRonda() {
  const nivel = motor.getNivel();
  const maxNumero = nivel === 1 ? 3 : 5; // nivel 1: solo hasta 3, niveles 2-3: hasta 5
  numeroObjetivo = numeroAleatorio(maxNumero);

  const cantidadOpciones = opcionesSegunNivel(nivel);
  const opciones = generarOpciones(numeroObjetivo, maxNumero, cantidadOpciones);

  renderRonda(numeroObjetivo, opciones);
}

function generarOpciones(correcto, maxNumero, cantidad) {
  const set = new Set([correcto]);
  while (set.size < cantidad) {
    const candidato = numeroAleatorio(maxNumero);
    set.add(candidato);
  }
  // Mezclar orden para que la respuesta correcta no esté siempre en la misma posición
  return Array.from(set).sort(() => Math.random() - 0.5);
}

function renderRonda(cantidad, opciones) {
  const contenedor = document.getElementById(CONTENEDOR_ID);
  if (!contenedor) {
    console.warn('numerosGame: no se encontró el contenedor', CONTENEDOR_ID);
    return;
  }

  const objetos = OBJETO_A_CONTAR.repeat(cantidad).split('').join(' ');

  contenedor.innerHTML = `
    <div class="numeros-juego">
      <div class="numeros-objetos" aria-label="${cantidad} objetos">${objetos}</div>
      <div class="numeros-opciones">
        ${opciones
          .map(
            (op) =>
              `<button class="numeros-boton" data-valor="${op}" aria-label="Número ${op}">${op}</button>`
          )
          .join('')}
      </div>
    </div>
  `;

  contenedor.querySelectorAll('.numeros-boton').forEach((boton) => {
    boton.addEventListener('click', () => manejarRespuesta(boton));
  });
}

function manejarRespuesta(boton) {
  const valorElegido = parseInt(boton.getAttribute('data-valor'), 10);
  const esCorrecto = valorElegido === numeroObjetivo;

  if (esCorrecto) {
    boton.classList.add('numeros-correcto');
    const resultado = motor.registrarAcierto();
    reproducirRefuerzoPositivo();
    setTimeout(() => generarRonda(), 1200);
  } else {
    boton.classList.add('numeros-incorrecto');
    motor.registrarError();
    // Se deja la ronda activa para que Jesús pueda intentarlo de nuevo
    setTimeout(() => boton.classList.remove('numeros-incorrecto'), 800);
  }
}

/**
 * Punto de enganche con el refuerzo de audio aleatorio ya existente en
 * companion.js (si ya está implementado ahí). Si esa función todavía no
 * existe, esta llamada simplemente no hace nada (comprobación segura).
 */
function reproducirRefuerzoPositivo() {
  if (typeof window.reproducirAudioRefuerzo === 'function') {
    window.reproducirAudioRefuerzo();
  }
}

/** Función pública para iniciar el juego desde el menú principal */
export function iniciarJuegoNumeros() {
  motor.reiniciarRachas();
  generarRonda();
}
