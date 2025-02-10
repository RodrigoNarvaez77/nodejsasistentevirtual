const express = require("express");
const router = express.Router();
const { manejarMensaje } = require("../controllers/chatbotController"); // Importamos el controlador

// Ruta para recibir el mensaje del frontend
router.post("/message", async (req, res, next) => {
  try {
    const { message } = req.body;

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
