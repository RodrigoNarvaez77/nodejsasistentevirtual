const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Cargar la clave API desde el archivo .env
});

// Función para calcular la cantidad de sacos de cemento
function calcularCemento(metrosCuadrados) {
  const sacoCubre = 1.5; // 1 saco cubre 1.5 m² (esto es solo un ejemplo, ajusta según lo que necesites)
  return Math.ceil(metrosCuadrados / sacoCubre); // Redondea hacia arriba para el número de sacos
}

// Cargar lista de productos desde JSON
const filePath = path.join(__dirname, "..", "productos", "productos.json");
const productos = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Función para procesar mensajes
async function procesarMensaje(mensajeUsuario) {
  const mensajeLower = mensajeUsuario.toLowerCase(); // Convertir el mensaje a minúsculas para evitar errores

  /*** 🛠 1️⃣ Verificar si la pregunta es sobre cemento ***/
  if (
    mensajeLower.includes("sacos de cemento") &&
    mensajeLower.includes("metros cuadrados")
  ) {
    const match = mensajeUsuario.match(/\d+/);
    const metrosCuadrados = match ? parseInt(match[0]) : null;

    if (metrosCuadrados !== null) {
      const sacosNecesarios = calcularCemento(metrosCuadrados);
      return `Para ${metrosCuadrados} metros cuadrados, necesitas aproximadamente ${sacosNecesarios} sacos de cemento.`;
    } else {
      return "Por favor, indica la cantidad de metros cuadrados para calcular los sacos de cemento necesarios.";
    }
  }

  /*** 🛠 2️⃣ Consultar por productos ***/
  if (
    mensajeLower.includes("tienen") ||
    mensajeLower.includes("venden") ||
    mensajeLower.includes("producto") ||
    mensajeLower.includes("stock")
  ) {
    const productosEncontrados = productos.filter((p) => {
      const palabrasClave = mensajeLower.split(" ");
      return palabrasClave.some((palabra) => p.toLowerCase().includes(palabra));
    });

    if (productosEncontrados.length > 0) {
      return `Sí, contamos con ese producto. Te puedo enviar el número de atención para consultar stock y precio.`;
    } else {
      return "Lo siento, no encuentro ese producto en nuestra lista. ¿Quieres que lo revise con un asesor?";
    }
  }

  /*** 🛠 3️⃣ Si no es sobre cemento ni productos, preguntar a OpenAI ***/
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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
        role: "system",
        content:
          "Nuestras sucursales son Arauco, Curanilahue, Huillinco, Santa Juana y Ohiggins Arauco.",
      },
      {
        role: "user",
        content: mensajeUsuario,
      },
    ],
  });

  return completion.choices[0].message.content;
}

module.exports = { procesarMensaje, calcularCemento };
