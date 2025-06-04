function calcularCemento(m2) {
  const sacoCubre = 1.5;
  return Math.ceil(m2 / sacoCubre);
}

function detectarCemento(mensaje) {
  const lower = mensaje.toLowerCase();
  if (
    lower.includes("sacos de cemento") &&
    lower.includes("metros cuadrados")
  ) {
    const match = mensaje.match(/\d+/);
    if (match) {
      const m2 = parseInt(match[0]);
      const sacos = calcularCemento(m2);
      return `Para ${m2} metros cuadrados, necesitas aproximadamente ${sacos} sacos de cemento.`;
    } else {
      return "Por favor, indícame cuántos metros cuadrados necesitas cubrir.";
    }
  }
  return null;
}

module.exports = detectarCemento;
