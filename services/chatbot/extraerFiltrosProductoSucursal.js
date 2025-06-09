const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extraerFiltros(mensaje) {
  const prompt = `
Del siguiente mensaje, extrae el producto y la sucursal (si se menciona).

Formato:
Producto: [nombre del producto]
Sucursal: [nombre de la sucursal] (puede estar vacía si no se menciona)

Mensaje: "${mensaje}"

Respuesta:
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: 50,
  });

  const content = response.choices[0].message.content.toLowerCase();

  const producto = content.match(/producto:\s*(.*)/)?.[1]?.trim() ?? "";
  const sucursal = content.match(/sucursal:\s*(.*)/)?.[1]?.trim() ?? "";

  return { producto, sucursal };
}

module.exports = extraerFiltros;
