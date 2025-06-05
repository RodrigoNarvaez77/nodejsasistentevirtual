const { OpenAI } = require("openai");
const detectarCemento = require("./chatbot/detectarCemento");
const buscarProducto = require("../productos/productos"); // ← tu nueva función SQL Server
const contextoSistema = require("./chatbot/contextoSistema");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function procesarMensaje(mensajeUsuario) {
  const mensajeLower = mensajeUsuario.toLowerCase();

  // 1️⃣ Cemento (respuesta directa)
  const respuestaCemento = detectarCemento(mensajeUsuario);
  if (respuestaCemento) return respuestaCemento;

  // 2️⃣ Productos – ahora consultamos SQL Server directamente
  try {
    const productoEncontrado = await buscarProducto(mensajeLower); // SIN archivo JSON
    console.log("🧪 Resultado de búsqueda SQL:", productoEncontrado);

    if (productoEncontrado.encontrado) {
      return productoEncontrado.mensaje;
    }
  } catch (error) {
    console.error("❌ Error al buscar producto:", error);
  }

  // 3️⃣ GPT (último recurso)
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [...contextoSistema, { role: "user", content: mensajeUsuario }],
  });

  return completion.choices[0].message.content;
}

module.exports = { procesarMensaje };
