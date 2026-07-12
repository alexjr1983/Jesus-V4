// gamesCore.js
// Motor compartido de dificultad adaptativa para los mini-juegos.
// Script normal (no módulo), igual que tus otros archivos js/*.js,
// para que pueda convivir con onclick="..." en el HTML.
// No toca IndexedDB de fotos/pictogramas en absoluto.

var NIVELES_JUEGO = [1, 2, 3]; // 1 = fácil, 2 = medio, 3 = difícil
var ACIERTOS_PARA_SUBIR = 3;
var ERRORES_PARA_BAJAR = 2;

function crearMotorDificultad(nombreJuego) {
  var claveStorage = 'dificultad_' + nombreJuego;
  var nivel = 1;
  var rachaAciertos = 0;
  var rachaErrores = 0;

  try {
    var guardado = localStorage.getItem(claveStorage);
    if (guardado) {
      var datos = JSON.parse(guardado);
      if (datos && NIVELES_JUEGO.indexOf(datos.nivel) !== -1) {
        nivel = datos.nivel;
      }
    }
  } catch (e) {
    console.warn('gamesCore: no se pudo cargar progreso de', nombreJuego, e);
  }

  function guardar() {
    try {
      localStorage.setItem(claveStorage, JSON.stringify({ nivel: nivel }));
    } catch (e) {
      console.warn('gamesCore: no se pudo guardar progreso de', nombreJuego, e);
    }
  }

  return {
    registrarAcierto: function () {
      rachaAciertos++;
      rachaErrores = 0;
      var subio = false;
      if (rachaAciertos >= ACIERTOS_PARA_SUBIR) {
        var idx = NIVELES_JUEGO.indexOf(nivel);
        if (idx < NIVELES_JUEGO.length - 1) {
          nivel = NIVELES_JUEGO[idx + 1];
          guardar();
          subio = true;
        }
        rachaAciertos = 0;
      }
      return { nivel: nivel, subioNivel: subio };
    },
    registrarError: function () {
      rachaErrores++;
      rachaAciertos = 0;
      var bajo = false;
      if (rachaErrores >= ERRORES_PARA_BAJAR) {
        var idx = NIVELES_JUEGO.indexOf(nivel);
        if (idx > 0) {
          nivel = NIVELES_JUEGO[idx - 1];
          guardar();
          bajo = true;
        }
        rachaErrores = 0;
      }
      return { nivel: nivel, bajoNivel: bajo };
    },
    getNivel: function () {
      return nivel;
    },
    reiniciarRachas: function () {
      rachaAciertos = 0;
      rachaErrores = 0;
    }
  };
}

function opcionesSegunNivel(nivel) {
  var escala = { 1: 2, 2: 3, 3: 4 };
  return escala[nivel] || 2;
}
