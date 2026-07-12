/**
 * gamesCore.js
 * Motor compartido de dificultad adaptativa para los mini-juegos
 * del Comunicador Jesús Next (Mat-IA).
 *
 * Principio de diseño: simplicidad. Este módulo no tiene dependencias
 * externas y no toca IndexedDB de fotos/pictogramas en absoluto.
 *
 * Cómo usarlo desde un juego (ej. numerosGame.js):
 *
 *   import { crearMotorDificultad } from './gamesCore.js';
 *   const motor = crearMotorDificultad({ juego: 'numeros' });
 *   motor.registrarAcierto();
 *   motor.registrarError();
 *   const nivelActual = motor.getNivel(); // 1, 2 o 3
 */

const NIVELES = [1, 2, 3]; // 1 = fácil, 2 = medio, 3 = difícil
const ACIERTOS_PARA_SUBIR = 3; // aciertos seguidos para subir de nivel
const ERRORES_PARA_BAJAR = 2;  // errores seguidos para bajar de nivel

/**
 * Crea una instancia independiente del motor de dificultad para un juego.
 * Cada juego debe tener su propia instancia (no se comparte estado entre
 * "numeros", "memoria" y "letras").
 *
 * @param {Object} opciones
 * @param {string} opciones.juego - nombre identificador del juego (para guardar progreso)
 * @param {number} [opciones.nivelInicial] - nivel de partida (por defecto 1)
 */
export function crearMotorDificultad({ juego, nivelInicial = 1 }) {
  let nivel = NIVELES.includes(nivelInicial) ? nivelInicial : 1;
  let rachaAciertos = 0;
  let rachaErrores = 0;

  const CLAVE_STORAGE = `dificultad_${juego}`;

  function cargarProgreso() {
    try {
      const guardado = localStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        const datos = JSON.parse(guardado);
        if (datos && NIVELES.includes(datos.nivel)) {
          nivel = datos.nivel;
        }
      }
    } catch (e) {
      // Si falla la lectura, seguimos con nivel por defecto. No rompemos el juego.
      console.warn('gamesCore: no se pudo cargar progreso de', juego, e);
    }
  }

  function guardarProgreso() {
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ nivel }));
    } catch (e) {
      console.warn('gamesCore: no se pudo guardar progreso de', juego, e);
    }
  }

  function subirNivel() {
    const idx = NIVELES.indexOf(nivel);
    if (idx < NIVELES.length - 1) {
      nivel = NIVELES[idx + 1];
      guardarProgreso();
      return true;
    }
    return false;
  }

  function bajarNivel() {
    const idx = NIVELES.indexOf(nivel);
    if (idx > 0) {
      nivel = NIVELES[idx - 1];
      guardarProgreso();
      return true;
    }
    return false;
  }

  // Cargamos progreso guardado al crear el motor
  cargarProgreso();

  return {
    /** Llamar cuando Jesús acierta una respuesta */
    registrarAcierto() {
      rachaAciertos++;
      rachaErrores = 0;
      let subio = false;
      if (rachaAciertos >= ACIERTOS_PARA_SUBIR) {
        subio = subirNivel();
        rachaAciertos = 0;
      }
      return { nivel, subioNivel: subio };
    },

    /** Llamar cuando Jesús falla una respuesta */
    registrarError() {
      rachaErrores++;
      rachaAciertos = 0;
      let bajo = false;
      if (rachaErrores >= ERRORES_PARA_BAJAR) {
        bajo = bajarNivel();
        rachaErrores = 0;
      }
      return { nivel, bajoNivel: bajo };
    },

    /** Devuelve el nivel actual (1, 2 o 3) */
    getNivel() {
      return nivel;
    },

    /** Reinicia rachas sin cambiar el nivel (útil al empezar una nueva sesión) */
    reiniciarRachas() {
      rachaAciertos = 0;
      rachaErrores = 0;
    },

    /** Reinicia el juego desde nivel 1 (por si Alejandro quiere un botón de "empezar de cero") */
    reiniciarNivel() {
      nivel = 1;
      rachaAciertos = 0;
      rachaErrores = 0;
      guardarProgreso();
    },
  };
}

/**
 * Utilidad común: devuelve cuántos elementos mostrar en pantalla según nivel.
 * Cada juego puede usar esto o definir su propia escala si lo necesita.
 * Ejemplo de uso en "números": nivel 1 = 2 opciones, nivel 2 = 3, nivel 3 = 4.
 */
export function opcionesSegunNivel(nivel) {
  const escala = { 1: 2, 2: 3, 3: 4 };
  return escala[nivel] || 2;
}
