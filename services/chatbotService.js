const { OpenAI } = require("openai");
const detectarCemento = require("./chatbot/detectarCemento");
const buscarProducto = require("../productos/productos");
const contextoSistema = require("./chatbot/contextoSistema");
const extraerFiltros = require("./chatbot/extraerFiltrosProductoSucursal");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🧠 GPT: Detectar intención del mensaje
async function detectarIntencion(mensaje) {
  const prompt = `
Solo responde con una palabra (sin frases): saludo, buscar_producto, reclamo, pregunta_general u otro.
¿Cuál es la intención del siguiente mensaje?

"${mensaje}"

Respuesta:
  `.trim();

  try {
    const respuesta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 10,
    });

    const texto = respuesta.choices[0].message.content.trim().toLowerCase();
    const match = texto.match(
      /(saludo|buscar_producto|reclamo|pregunta_general|otro)/i
    );
    return match ? match[1] : "otro";
  } catch (error) {
    console.error("❌ Error al detectar intención con GPT:", error.message);
    return "otro";
  }
}

// 🔁 Función principal del chatbot
async function procesarMensaje(mensajeUsuario) {
  const mensajeLower = mensajeUsuario.toLowerCase();
  console.log("📥 Mensaje recibido del frontend:", mensajeUsuario);

  // 1️⃣ Cemento
  const respuestaCemento = detectarCemento(mensajeUsuario);
  if (respuestaCemento) {
    console.log("🧱 Consulta de cemento detectada.");
    return respuestaCemento;
  }

  // 2️⃣ Intención con GPT
  const intencion = await detectarIntencion(mensajeUsuario);
  console.log("🎯 Intención detectada:", intencion);

  if (intencion === "saludo") {
    console.log("👋 Respuesta automática por saludo.");
    return "🦊 ¡Hola! ¿En qué puedo ayudarte hoy?";
  }

  if (intencion === "buscar_producto") {
    console.log("🛒 Buscando producto en SQL Server...");
    try {
      const { producto, sucursal } = await extraerFiltros(mensajeUsuario);
      console.log("🔎 Filtros extraídos:", { producto, sucursal });

      const productoEncontrado = await buscarProducto(producto, sucursal); // ahora debes adaptar buscarProducto()
      console.log("🧪 Resultado de búsqueda:", productoEncontrado);

      if (productoEncontrado.encontrado) {
        console.log("✅ Producto encontrado.");
        return productoEncontrado.mensaje;
      } else {
        console.warn("⚠️ Producto no encontrado.");
      }
    } catch (error) {
      console.error("❌ Error en buscarProducto:", error);
    }

    console.log(
      "📭 No se encontraron coincidencias. Enviando mensaje alternativo."
    );
    return "📦 Lo siento, no encontré productos con ese nombre. ¿Puedes ser más específico?";
  }

  if (intencion === "reclamo") {
    console.log("⚠️ Reclamo detectado.");
    return "⚠️ Lamentamos cualquier inconveniente. ¿Puedes contarnos qué sucedió?";
  }

  // 3️⃣ GPT como fallback
  console.log("❓ Intención no reconocida. Derivando a GPT.");
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [...contextoSistema, { role: "user", content: mensajeUsuario }],
    });

    const respuestaGPT = completion.choices[0].message.content;
    console.log("🤖 Respuesta GPT:", respuestaGPT);
    return respuestaGPT;
  } catch (error) {
    console.error("❌ Error al generar respuesta con GPT:", error.message);
    return "😕 Lo siento, algo salió mal. ¿Puedes intentarlo de nuevo?";
  }
}

module.exports = { procesarMensaje };
