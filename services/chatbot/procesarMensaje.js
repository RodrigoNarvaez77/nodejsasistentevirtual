const { OpenAI } = require("openai");
const path = require("path");
const fs = require("fs");
const detectarCemento = require("./detectarCemento");
const buscarProducto = require("./buscarProducto");
const contextoSistema = require("./contextoSistema");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function procesarMensaje(mensajeUsuario) {
  const mensajeLower = mensajeUsuario.toLowerCase();

  // 1️⃣ Cemento
  const respuestaCemento = detectarCemento(mensajeUsuario);
  if (respuestaCemento) return respuestaCemento;

  // 2️⃣ Productos
  const productos = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../productos/productos.json"),
      "utf8"
    )
  );

  const productoEncontrado = buscarProducto(mensajeLower, productos);
  if (productoEncontrado.encontrado) return productoEncontrado.mensaje;

  // 3️⃣ OpenAI (respuestas generales)
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [...contextoSistema, { role: "user", content: mensajeUsuario }],
  });

  return completion.choices[0].message.content;
}

module.exports = { procesarMensaje };
