require("dotenv").config();
const express = require("express");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const openai = require("./routes/openairoutes"); // Importa las rutas
const PORT = process.env.PORT || 3000; // ✅ Corrección del puerto

// ✅ Habilitar CORS ANTES de definir las rutas
app.use(
  cors({
    origin: "*", // Permitir cualquier dominio
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ Middleware de seguridad (Helmet)
app.use(helmet());

// ✅ Middleware para analizar JSON (esto debe estar antes de las rutas)
app.use(express.json());

// ✅ Rutas de la API (Asegurar que se definan después de CORS y JSON middleware)
app.use("/api/data", openai);

// ✅ Ruta de prueba para verificar si Render está respondiendo
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente ✅");
});

// ✅ Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//hola
