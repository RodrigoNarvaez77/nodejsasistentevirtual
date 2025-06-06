require("dotenv").config();
const sql = require("mssql");

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Diccionario de alias de sucursales
const aliasSucursales = {
  chue: "CURANILAHUE",
  sj: "SANTA JUANA",
  arauco: "CASA MATRIZ ARAUCO",
  canete: "CAÑETE",
  ohi: "BODEGA OHIGGINS",
  huillinco: "HUILLINCO",
};

// Función para limpiar la frase del usuario
function limpiarConsulta(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar tildes
    .replace(/[.,!?¿¡]/g, "") // quitar signos
    .split(/\s+/)
    .filter((p) => p.length > 2 && /^[a-z]+$/.test(p)); // solo palabras válidas
}

async function buscarProducto(consulta) {
  try {
    const pool = await sql.connect(config);

    const consultaOriginal = consulta.toLowerCase();
    const palabras = limpiarConsulta(consulta);
    const coincidencias = [];

    // 🧭 Buscar sucursal mencionada en el texto
    let sucursalDetectada = null;
    for (const [alias, nombre] of Object.entries(aliasSucursales)) {
      if (consultaOriginal.includes(alias)) {
        sucursalDetectada = nombre;
        break;
      }
    }

    // Palabras irrelevantes (no deberían activar búsqueda)
    const ignorarGenericos = new Set([
      "hola",
      "los",
      "las",
      "me",
      "por",
      "dame",
      "el",
      "del",
      "una",
      "cuanto",
      "cuesta",
      "precio",
      "valor",
      "quiero",
      "hay",
      "tienen",
      "usted",
      "necesito",
      "producto",
      "productos",
      "casa",
      "construccion",
      "hogar",
      "edificio",
      "galpon",
      "hacer",
      "construir",
    ]);

    // 🧠 Buscar palabras que sí estén en los productos
    for (const palabra of palabras) {
      const result = await pool
        .request()
        .input("consulta", sql.VarChar, `%${palabra}%`).query(`
          SELECT TOP 1 NOKOPR 
          FROM MAEPR 
          WHERE LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @consulta
        `);

      if (result.recordset.length > 0 && !ignorarGenericos.has(palabra)) {
        coincidencias.push(palabra);
      }
    }

    // ⛔ No se detectaron productos útiles
    if (coincidencias.length === 0) {
      return {
        encontrado: false,
        mensaje:
          '🛠️ No se detectó ningún producto específico en tu mensaje.\n\n¿Estás buscando materiales de construcción? Puedes consultar por:\n- Cemento\n- Planchas OSB\n- Madera\n- Perfiles metálicos\n- Clavos, tornillos\n- Pintura, techumbre, aislantes\n\nEjemplo: "¿Tienen cemento?" o "precio planchas osb"',
      };
    }

    // 🧾 Armar condiciones del SQL
    const condiciones = coincidencias
      .map(
        (palabra, idx) =>
          `LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @palabra${idx}`
      )
      .join(" OR ");

    const request = pool.request();
    coincidencias.forEach((palabra, idx) =>
      request.input(`palabra${idx}`, sql.VarChar, `%${palabra}%`)
    );

    if (sucursalDetectada) {
      request.input("sucursal", sql.VarChar, sucursalDetectada);
    }

    const resultado = await request.query(`
      SELECT 
        TABSU.NOKOSU AS SUCURSAL,
        NOKOPR AS NOMBRE_PRODUCTO,
        MAEST.STFI1 AS STOCK_FISICO,
        PP01UD AS PRECIO_BRUTO
      FROM MAEST
      INNER JOIN MAEPR ON MAEPR.KOPR = MAEST.KOPR
      INNER JOIN (SELECT * FROM TABPRE WHERE KOLT = '02P') PBRUTO 
        ON PBRUTO.KOPR = MAEPR.KOPR
      INNER JOIN TABSU ON TABSU.KOSU = MAEST.KOSU
      WHERE 
        MAEST.KOPR NOT LIKE '%ZZ%' AND  
        MAEST.KOSU NOT LIKE '901' AND
        (${condiciones})
        ${sucursalDetectada ? "AND TABSU.NOKOSU = @sucursal" : ""}
      ORDER BY STOCK_FISICO DESC;
    `);

    const rows = resultado.recordset;

    if (rows.length === 0) {
      return {
        encontrado: false,
        mensaje: `⚠️ No se encontraron productos relacionados con: ${coincidencias.join(
          ", "
        )}`,
      };
    }

    const mensaje = rows
      .map(
        (p) =>
          `🧰 ${p.SUCURSAL}${
            p.NOMBRE_PRODUCTO
          } – $${p.PRECIO_BRUTO.toLocaleString("es-CL")} (${
            p.STOCK_FISICO
          } unidades en stock)`
      )
      .join("\n");

    return {
      encontrado: true,
      mensaje: `🔍 Productos encontrados relacionados con: ${coincidencias.join(
        ", "
      )}${sucursalDetectada ? " en " + sucursalDetectada : ""}\n${mensaje}`,
    };
  } catch (err) {
    console.error("❌ Error al buscar producto:", err);
    return {
      encontrado: false,
      mensaje: "⚠️ Ocurrió un error al realizar la búsqueda.",
    };
  } finally {
    sql.close();
  }
}

module.exports = buscarProducto;
