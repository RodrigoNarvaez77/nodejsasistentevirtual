const express = require("express");
const router = express.Router();
const { manejarMensaje } = require("../controllers/chatbotController"); // Importamos el controlador

// Ruta para recibir el mensaje del frontend
router.post("/message", async (req, res, next) => {
  try {
    const { message } = req.body;

    // Validación: Verificar que el mensaje no sea vacío o inválido
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        error: "El mensaje no es válido. Por favor, envía un mensaje válido.",
      });
    }

    // Pasar la solicitud al controlador
    await manejarMensaje(req, res);
  } catch (error) {
    console.error("Error al procesar el mensaje:", error);

    // Enviar un error genérico si algo falla
    res.status(500).json({
      error: "Ocurrió un error procesando el mensaje. Intenta nuevamente.",
    });
  }
});

module.exports = router;
