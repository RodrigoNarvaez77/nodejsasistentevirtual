const { procesarMensaje } = require("../services/chatbotService"); // Importamos el servicio

// Función para manejar las peticiones del usuario
async function manejarMensaje(req, res) {
  const { mensaje } = req.body; // Obtenemos el mensaje del cuerpo de la solicitud
  console.log("📥 Mensaje recibido del frontend:", mensaje);

  try {
    // Validar que el mensaje no sea nulo o vacío
    if (!mensaje || typeof mensaje !== "string" || mensaje.trim() === "") {
      console.warn("⚠️ Mensaje no válido recibido:", mensaje);
      return res
        .status(400)
        .json({ error: "El mensaje no es válido. Envía un texto válido." });
    }

    // Procesamos el mensaje y obtenemos la respuesta
    const respuesta = await procesarMensaje(mensaje.trim()); // Eliminar espacios innecesarios
    console.log("📤 Respuesta enviada al frontend:", respuesta);

    // Enviamos la respuesta al frontend
    res.json({ respuesta });
  } catch (error) {
    console.error("❌ Error al procesar el mensaje:", error);

    // Manejo específico de errores de OpenAI o del servicio
    if (error.response) {
      return res.status(error.response.status).json({
        error:
          error.response.data.error.message ||
          "Error en la respuesta de OpenAI",
      });
    }

    // Enviar un error genérico si algo falla
    res
      .status(500)
      .json({ error: "Error procesando el mensaje. Intenta nuevamente." });
  }
}

module.exports = { manejarMensaje };
