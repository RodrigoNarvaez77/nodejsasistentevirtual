const express = require("express");
const router = express.Router();
const { manejarMensaje } = require("../controllers/chatbotController"); // Importamos el controlador

// Ruta para recibir el mensaje del frontend
router.post("/message", manejarMensaje);

module.exports = router;
