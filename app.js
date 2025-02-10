require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const helmet = require("helmet");
const openai = require("./routes/openairoutes"); // Importa las rutas
const PORT = process.PORT || 3000;

// Middleware para servir archivos estáticos desde la carpeta View
//app.use(express.static(path.join(__dirname, "./View")));

// Middleware para analizar los datos en formato JSON
app.use(express.json()); // Esto es esencial para que req.body sea accesible como JSON

// Endpoint para cargar datos de una API
//ruta del archivo
app.use("/api/data", openai);

// Usa Helmet para proteger tu app
app.use(helmet());

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
