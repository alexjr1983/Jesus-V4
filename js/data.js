/* ============================================================
   data.js — Vocabulario por defecto del comunicador.
   Si quieres añadir/cambiar el vocabulario de fábrica (no el que
   Jesús ya tiene guardado en su móvil), es aquí donde se toca.
   ============================================================ */

function i(id, name, speech, icon, action = "") {
  return { id, name, speech, icon, photo: "", action };
}

const DEFAULT_DATA = {
  cats: [
    { id: "nucleo", icon: "⭐", name: "Núcleo" },
    { id: "personas", icon: "👨‍👩‍👦", name: "Personas" },
    { id: "lugares", icon: "📍", name: "Lugares" },
    { id: "comidas", icon: "🍽️", name: "Comidas" },
    { id: "actividades", icon: "⚽", name: "Actividades" },
    { id: "emociones", icon: "😊", name: "Emociones" },
    { id: "dolor", icon: "🆘", name: "Dolor" },
    { id: "rapidas", icon: "⚡", name: "Frases" }
  ],
  items: {
    nucleo: [
      i("quiero", "Quiero", "quiero", "🙋", "want"),
      i("mas", "Más", "más", "➕"),
      i("no", "No", "no", "❌"),
      i("si", "Sí", "sí", "✅"),
      i("ayuda", "Ayuda", "necesito ayuda", "🆘"),
      i("terminado", "Terminado", "he terminado", "🏁"),
      i("gracias", "Gracias", "gracias", "🙏"),
      i("hola", "Hola", "hola", "👋")
    ],
    personas: [
      i("mama", "Mamá", "mamá", "👩"),
      i("papa", "Papá", "papá", "👨"),
      i("diego", "Diego", "Diego", "👦"),
      i("erik", "Erik", "Erik", "👦"),
      i("carol", "Carol", "Carol", "👩"),
      i("profesor", "Profesor/a", "mi profesor o profesora", "🏫"),
      i("abuelo_vicente", "Abuelo Vicente", "abuelo Vicente", "👴"),
      i("abuela_rian", "Abuela Rian", "abuela Rian", "👵")
    ],
    lugares: [
      i("casa", "Casa", "casa", "🏠"),
      i("colegio", "Colegio", "colegio", "🏫"),
      i("autobus", "Autobús", "autobús", "🚌"),
      i("piscina", "Piscina", "piscina", "🏊"),
      i("super", "Supermercado", "supermercado", "🛒"),
      i("terapia", "Terapia", "terapia", "🧩"),
      i("baloncesto_lugar", "Baloncesto", "baloncesto", "🏀")
    ],
    comidas: [
      i("agua", "Agua", "quiero agua", "💧"),
      i("petit", "Petit chocolate", "quiero petit de chocolate", "🍫"),
      i("yogur", "Yogur", "quiero yogur", "🥣"),
      i("flan", "Flan", "quiero flan", "🍮"),
      i("pure", "Puré", "quiero puré", "🥣"),
      i("galletas", "Galletas", "quiero galletas", "🍪")
    ],
    actividades: [
      i("jugar", "Jugar", "quiero jugar", "🎮"),
      i("piscina_act", "Piscina", "he ido a la piscina", "🏊"),
      i("basket", "Baloncesto", "he jugado al baloncesto", "🏀"),
      i("pasear", "Pasear", "quiero pasear", "🚶"),
      i("compras", "Compras", "he ido de compras", "🛒"),
      i("descansar", "Descansar", "quiero descansar", "🛌")
    ],
    emociones: [
      i("contento", "Contento", "estoy contento", "😊"),
      i("triste", "Triste", "estoy triste", "😢"),
      i("enfadado", "Enfadado", "estoy enfadado", "😡"),
      i("nervioso", "Nervioso", "estoy nervioso", "😰"),
      i("cansado", "Cansado", "estoy cansado", "😴"),
      i("miedo", "Miedo", "tengo miedo", "😨")
    ],
    dolor: [
      i("mal", "Me encuentro mal", "me encuentro mal", "😟"),
      i("cabeza", "Cabeza", "me duele la cabeza", "🤕"),
      i("barriga", "Barriga", "me duele la barriga", "🤰"),
      i("garganta", "Garganta", "me duele la garganta", "😷"),
      i("boca", "Boca", "me duele la boca", "👄"),
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
