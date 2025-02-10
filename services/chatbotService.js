const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Cargar la clave API desde el archivo .env
});

// Función para calcular la cantidad de sacos de cemento
function calcularCemento(metrosCuadrados) {
  const sacoCubre = 1.5; // 1 saco cubre 1.5 m² (esto es solo un ejemplo, ajusta según lo que necesites)
  return Math.ceil(metrosCuadrados / sacoCubre); // Redondea hacia arriba para el número de sacos
}

// Función para interactuar con la API de OpenAI
async function procesarMensaje(mensajeUsuario) {
  // Realiza la llamada a la API de OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Usa el modelo que prefieras
    store: true,
    messages: [
      {
        role: "system",
        content:
          "Eres un asistente virtual para una ferretería Solucenter. Responde a preguntas sobre productos, precios, horarios, contactos y promociones de la ferretería.",
      },
      {
        role: "system",
        content:
          "Si alguien pregunta por Curanilahue, responde que la persona encargada de ventas se llama Rosalía Maldonado y su número de teléfono es +569 4008 1496.",
      },
      {
        role: "system",
        content:
          "Si alguien pregunta por Cañete, responde que la persona encargada de ventas se llama Pedro Vera y su número de teléfono es +569 9642 3516.",
      },
      {
        role: "system",
        content:
          "Si alguien pregunta por Arauco, responde que la persona encargada de ventas se llama Carolina Figueroa y su número de teléfono es +569 9642 3516.",
      },
      {
        role: "system",
        content:
          "Si alguien pregunta por Horarios, responde Nuestro horario de atención es de lunes a viernes de 09:00 AM a 14:00 PM y de 15:00 PM a 18:00 PM y sábados de 10:00 AM a 14:00 PM.",
      },
      {
        role: "user",
        content: mensajeUsuario, // El mensaje del usuario
      },
    ],
  });

  const respuesta = completion.choices[0].message.content;

  // Verificar si la pregunta está relacionada con el cálculo de cemento
  if (
    mensajeUsuario.toLowerCase().includes("sacos de cemento") &&
    mensajeUsuario.toLowerCase().includes("metros cuadrados")
  ) {
    // Extraemos el número de metros cuadrados de la pregunta
    const metrosCuadrados = parseInt(mensajeUsuario.match(/\d+/)[0]); // Extrae el número de metros cuadrados
    const sacosNecesarios = calcularCemento(metrosCuadrados);

    return `Para ${metrosCuadrados} metros cuadrados, necesitas aproximadamente ${sacosNecesarios} sacos de cemento.`;
  }

  return respuesta;
}

module.exports = { procesarMensaje, calcularCemento };
