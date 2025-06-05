function buscarProducto(mensajeLower, productos) {
  for (const producto of productos) {
    const productoLower = producto.toLowerCase();

    // Coincidencia exacta (o dentro del mensaje)
    if (mensajeLower.includes(productoLower)) {
      return {
        encontrado: true,
        mensaje:
          "Sí, contamos con ese producto. ¿Deseas consultar stock y precio con un asesor?",
      };
    }
  }

  return {
    encontrado: false,
    mensaje: null,
  };
}

module.exports = buscarProducto;
