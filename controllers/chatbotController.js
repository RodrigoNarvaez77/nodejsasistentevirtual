const { procesarMensaje } = require("../services/chatbotService"); // Asegúrate del path correcto

// 🎯 Controlador que maneja los mensajes del usuario
async function manejarMensaje(req, res) {
  const { mensaje } = req.body;

  console.log("📥 Mensaje recibido del frontend:", mensaje);

  // 1️⃣ Validar entrada
  if (!mensaje || typeof mensaje !== "string" || !mensaje.trim()) {
    console.warn("⚠️ Mensaje no válido recibido:", mensaje);
    return res.status(400).json({
      error: "El mensaje enviado no es válido. Debe ser un texto.",
    });
  }

  try {
    // 2️⃣ Procesar mensaje
    const respuesta = await procesarMensaje(mensaje.trim());
    console.log("📤 Respuesta enviada al frontend:", respuesta);

    // 3️⃣ Responder
    return res.json({ respuesta });
  } catch (error) {
    console.error("❌ Error al procesar el mensaje:", error);

    // 4️⃣ Respuesta específica si viene desde OpenAI u otra API
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        error:
          error.response.data.error?.message || "Error desde el modelo de IA",
      });
    }

    // 5️⃣ Respuesta genérica
    return res.status(500).json({
      error: "Error interno al procesar el mensaje. Intenta nuevamente.",
    });
  }
}

module.exports = { manejarMensaje };
