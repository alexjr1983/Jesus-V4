/* ============================================================
   data.js — Vocabulario por defecto del comunicador.
   Si quieres añadir/cambiar el vocabulario de fábrica (no el que
   Jesús ya tiene guardado en su móvil), es aquí donde se toca.

   NOVEDAD V5: cada categoría tiene un "type" (función gramatical:
   social, persona, lugar, objeto, verbo, descriptor, cuerpo, frase).
   Ese type decide el color de sus pestañas y tarjetas en toda la
   app (ui.js + styles.css), inspirado en el sistema de colores de
   Eneso Verbo, para que el código de color sea el mismo en casa
   que en el cole. No cambia el funcionamiento, solo el "qué
   vocabulario hay" y "de qué color se ve".
   ============================================================ */

function i(id, name, speech, icon, action = "") {
  return { id, name, speech, icon, photo: "", action };
}

const DATA_VERSION = 5;

const DEFAULT_DATA = {
  version: DATA_VERSION,
  cats: [
    { id: "nucleo", icon: "⭐", name: "Núcleo", type: "social" },
    { id: "verbos", icon: "🏃", name: "Verbos", type: "verbo" },
    { id: "personas", icon: "👨‍👩‍👦", name: "Personas", type: "persona" },
    { id: "lugares", icon: "📍", name: "Lugares", type: "lugar" },
    { id: "comidas", icon: "🍽️", name: "Comidas", type: "objeto" },
    { id: "ropa", icon: "👕", name: "Ropa", type: "objeto" },
    { id: "actividades", icon: "⚽", name: "Actividades", type: "verbo" },
    { id: "animales", icon: "🐶", name: "Animales", type: "objeto" },
    { id: "emociones", icon: "😊", name: "Emociones", type: "descriptor" },
    { id: "dolor", icon: "🆘", name: "Cuerpo y dolor", type: "cuerpo" },
    { id: "rapidas", icon: "⚡", name: "Frases", type: "frase" }
  ],
  items: {
    nucleo: [
      i("yo", "Yo", "yo", "🙋‍♂️"),
      i("quiero", "Quiero", "quiero", "🙋", "want"),
      i("mas", "Más", "más", "➕"),
      i("no", "No", "no", "❌"),
      i("si", "Sí", "sí", "✅"),
      i("ayuda", "Ayuda", "necesito ayuda", "🆘"),
      i("terminado", "Terminado", "he terminado", "🏁"),
      i("gracias", "Gracias", "gracias", "🙏"),
      i("hola", "Hola", "hola", "👋"),
      i("adios", "Adiós", "adiós", "🖐️"),
      i("porfavor", "Por favor", "por favor", "🤲")
    ],
    verbos: [
      i("v_ir", "Ir", "ir", "🚗"),
      i("v_comer", "Comer", "comer", "🍽️"),
      i("v_beber", "Beber", "beber", "💧"),
      i("v_jugar", "Jugar", "jugar", "🎮"),
      i("v_dormir", "Dormir", "dormir", "😴"),
      i("v_ayudar", "Ayudar", "ayudar", "🤝"),
      i("v_hablar", "Hablar", "hablar", "🗣️"),
      i("v_mirar", "Mirar", "mirar", "👀"),
      i("v_dar", "Dar", "dar", "🤲"),
      i("v_escuchar", "Escuchar", "escuchar", "👂"),
      i("v_bailar", "Bailar", "bailar", "💃"),
      i("v_duchar", "Ducharse", "ducharse", "🚿")
    ],
    personas: [
      i("mama", "Mamá", "mamá", "👩"),
      i("papa", "Papá", "papá", "👨"),
      i("diego", "Diego", "Diego", "👦"),
      i("erik", "Erik", "Erik", "👦"),
      i("carol", "Carol", "Carol", "👩"),
      i("profesor", "Profesor/a", "mi profesor o profesora", "🏫"),
      i("abuelo_vicente", "Abuelo Vicente", "abuelo Vicente", "👴"),
      i("abuela_rian", "Abuela Rian", "abuela Rian", "👵"),
      i("amigo", "Amigo/a", "mi amigo o amiga", "🧑")
    ],
    lugares: [
      i("casa", "Casa", "casa", "🏠"),
      i("colegio", "Colegio", "colegio", "🏫"),
      i("autobus", "Autobús", "autobús", "🚌"),
      i("piscina", "Piscina", "piscina", "🏊"),
      i("super", "Supermercado", "supermercado", "🛒"),
      i("terapia", "Terapia", "terapia", "🧩"),
      i("baloncesto_lugar", "Baloncesto", "baloncesto", "🏀"),
      i("parque", "Parque", "parque", "🌳"),
      i("restaurante", "Restaurante", "restaurante", "🍴")
    ],
    comidas: [
      i("agua", "Agua", "quiero agua", "💧"),
      i("petit", "Petit chocolate", "quiero petit de chocolate", "🍫"),
      i("yogur", "Yogur", "quiero yogur", "🥣"),
      i("flan", "Flan", "quiero flan", "🍮"),
      i("pure", "Puré", "quiero puré", "🥣"),
      i("galletas", "Galletas", "quiero galletas", "🍪"),
      i("leche", "Leche", "quiero leche", "🥛"),
      i("zumo", "Zumo", "quiero zumo", "🧃"),
      i("pan", "Pan", "quiero pan", "🍞"),
      i("fruta", "Fruta", "quiero fruta", "🍓")
    ],
    ropa: [
      i("camiseta", "Camiseta", "quiero ponerme la camiseta", "👕"),
      i("pantalon", "Pantalón", "quiero ponerme el pantalón", "👖"),
      i("abrigo", "Abrigo", "quiero ponerme el abrigo", "🧥"),
      i("zapatillas", "Zapatillas", "quiero ponerme las zapatillas", "👟"),
      i("calcetines", "Calcetines", "quiero ponerme los calcetines", "🧦"),
      i("gorra", "Gorra", "quiero ponerme la gorra", "🧢"),
      i("pijama", "Pijama", "quiero ponerme el pijama", "🌙")
    ],
    actividades: [
      i("jugar", "Jugar", "quiero jugar", "🎮"),
      i("piscina_act", "Piscina", "he ido a la piscina", "🏊"),
      i("basket", "Baloncesto", "he jugado al baloncesto", "🏀"),
      i("pasear", "Pasear", "quiero pasear", "🚶"),
      i("compras", "Compras", "he ido de compras", "🛒"),
      i("descansar", "Descansar", "quiero descansar", "🛌"),
      i("leer_act", "Leer", "quiero leer", "📖"),
      i("pintar_act", "Pintar", "quiero pintar", "🎨")
    ],
    animales: [
      i("perro", "Perro", "perro", "🐶"),
      i("gato", "Gato", "gato", "🐱"),
      i("caballo", "Caballo", "caballo", "🐴"),
      i("vaca", "Vaca", "vaca", "🐮"),
      i("pez", "Pez", "pez", "🐟"),
      i("pajaro", "Pájaro", "pájaro", "🐦")
    ],
    emociones: [
      i("contento", "Contento", "estoy contento", "😊"),
      i("triste", "Triste", "estoy triste", "😢"),
      i("enfadado", "Enfadado", "estoy enfadado", "😡"),
      i("nervioso", "Nervioso", "estoy nervioso", "😰"),
      i("cansado", "Cansado", "estoy cansado", "😴"),
      i("miedo", "Miedo", "tengo miedo", "😨"),
      i("calor", "Calor", "tengo calor", "🥵"),
      i("frio", "Frío", "tengo frío", "🥶")
    ],
    dolor: [
      i("mal", "Me encuentro mal", "me encuentro mal", "😟"),
      i("cabeza", "Cabeza", "me duele la cabeza", "🤕"),
      i("barriga", "Barriga", "me duele la barriga", "🤰"),
      i("garganta", "Garganta", "me duele la garganta", "😷"),
      i("boca", "Boca", "me duele la boca", "👄"),
      i("oreja", "Oreja", "me duele la oreja", "👂"),
      i("espalda", "Espalda", "me duele la espalda", "🔙"),
      i("pierna", "Pierna", "me duele la pierna", "🦵"),
      i("no_se", "No sé decirlo", "no sé decirlo", "🤔")
    ],
    rapidas: [
      i("quiero_comer", "Quiero comer", "quiero comer", "🍽️", "open:comidas"),
      i("quiero_ir", "Quiero ir", "quiero ir", "🚗", "open:lugares"),
      i("quiero_estar", "Quiero estar con", "quiero estar con", "👨‍👩‍👦", "open:personas"),
      i("he_colegio", "Hoy he ido al colegio", "hoy he ido al colegio", "🏫"),
      i("he_piscina", "Hoy he ido a piscina", "hoy he ido a piscina", "🏊"),
      i("quiero_llamar", "Quiero llamar", "quiero llamar", "📞", "open:personas")
    ]
  },
  intents: {
    want: [
      i("branch_comer", "Comer", "comer", "🍽️", "branch:comidas"),
      i("branch_beber", "Beber", "beber", "💧", "branch:comidas"),
      i("branch_ir", "Ir", "ir", "🚗", "branch:lugares"),
      i("branch_jugar", "Jugar", "jugar", "🎮", "branch:actividades"),
      i("branch_descansar", "Descansar", "descansar", "🛌", "branch:")
    ]
  },
  usage: {}
};

/* ---------- Colores por función gramatical (mismo mapa que usa la UI) ----------
   Se define aquí, junto al dato, para que ui.js y styles.css compartan
   una única fuente de verdad sobre qué "type" existe y con qué se
   corresponde. Si añades un type nuevo, añádelo también aquí. */
const CAT_TYPE_LABELS = {
  social: "Social / núcleo",
  verbo: "Verbos",
  persona: "Personas",
  lugar: "Lugares",
  objeto: "Objetos",
  descriptor: "Sentimientos y descripciones",
  cuerpo: "Cuerpo",
  frase: "Frases rápidas"
};

/* ============================================================
   Fusión no destructiva: cuando Jesús ya tiene datos guardados en
   su tablet (fotos, usos, categorías propias), esta función añade
   las categorías/palabras NUEVAS de esta versión sin tocar ni
   borrar nada de lo que ya tenía. Se llama desde storage.js.
   ============================================================ */
function mergeWithDefaults(d) {
  if (!d) return JSON.parse(JSON.stringify(DEFAULT_DATA));
  d.items = d.items || {};
  const existingCatMap = {};
  (d.cats || []).forEach(c => { existingCatMap[c.id] = c; });
  const handled = new Set();
  const mergedCats = [];

  DEFAULT_DATA.cats.forEach(defCat => {
    handled.add(defCat.id);
    let cat = existingCatMap[defCat.id];
    if (!cat) {
      // Categoría totalmente nueva en esta versión: se añade entera.
      cat = { ...defCat };
      d.items[defCat.id] = JSON.parse(JSON.stringify(DEFAULT_DATA.items[defCat.id] || []));
    } else {
      // Categoría ya existente: se actualiza su color/tipo e icono
      // de fábrica, pero se conservan sus tarjetas tal cual estaban,
      // añadiendo solo las palabras nuevas que aún no tenga.
      cat = { ...cat, type: defCat.type, name: defCat.name, icon: cat.icon || defCat.icon };
      const existingItems = d.items[defCat.id] || [];
      const existingIds = new Set(existingItems.map(x => x.id));
      (DEFAULT_DATA.items[defCat.id] || []).forEach(defItem => {
        if (!existingIds.has(defItem.id)) existingItems.push({ ...defItem });
      });
      d.items[defCat.id] = existingItems;
    }
    mergedCats.push(cat);
  });
  // Categorías propias que la familia haya creado a mano se conservan al final.
  (d.cats || []).forEach(c => { if (!handled.has(c.id)) mergedCats.push(c); });
  d.cats = mergedCats;

  d.usage = d.usage || {};
  d.sequences = d.sequences || {};
  d.intents = d.intents || JSON.parse(JSON.stringify(DEFAULT_DATA.intents));
  Object.keys(DEFAULT_DATA.intents || {}).forEach(key => {
    d.intents[key] = d.intents[key] || [];
    const ids = new Set(d.intents[key].map(x => x.id));
    DEFAULT_DATA.intents[key].forEach(it => { if (!ids.has(it.id)) d.intents[key].push({ ...it }); });
  });
  d.dataVersion = DATA_VERSION;
  return d;
}
