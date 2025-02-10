const { procesarMensaje } = require("../services/chatbotService"); // Importamos el servicio

// Función para manejar las peticiones del usuario
async function manejarMensaje(req, res) {
  const { mensaje } = req.body; // Obtenemos el mensaje del cuerpo de la solicitud
  console.log(mensaje);

  try {
    // Procesamos el mensaje y obtenemos la respuesta
    const respuesta = await procesarMensaje(mensaje);
    res.json({ respuesta }); // Enviamos la respuesta al frontend
  } catch (error) {
    console.error("Error al procesar el mensaje:", error);
    res.status(500).json({ error: "Error procesando el mensaje" });
  }
}

module.exports = { manejarMensaje };
