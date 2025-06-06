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

async function buscarProducto(consulta) {
  try {
    const pool = await sql.connect(config);

    // 1️⃣ Normalizar y limpiar palabras
    const palabras = consulta
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // eliminar tildes
      .replace(/[.,!?¿¡]/g, "") // quitar puntuación
      .split(/\s+/)
      .filter((p) => p.length > 2 && /^[a-z]+$/.test(p)); // solo palabras útiles

    // 2️⃣ Palabras comunes a ignorar, incluso si existen en productos
    const ignorarSiCoincide = new Set([
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
    ]);

    const coincidencias = [];

    // 3️⃣ Buscar palabras que realmente coincidan con productos (y no sean irrelevantes)
    for (const palabra of palabras) {
      const result = await pool
        .request()
        .input("consulta", sql.VarChar, `%${palabra}%`).query(`
          SELECT TOP 1 NOKOPR 
          FROM MAEPR 
          WHERE LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @consulta
        `);

      if (result.recordset.length > 0 && !ignorarSiCoincide.has(palabra)) {
        coincidencias.push(palabra);
      }
    }

    // 4️⃣ Si no hay coincidencias útiles
    if (coincidencias.length === 0) {
      return {
        encontrado: false,
        mensaje: "❌ No se reconoció ningún producto en tu consulta.",
      };
    }

    // 5️⃣ Armar consulta con todas las palabras válidas encontradas
    const condiciones = coincidencias
      .map(
        (palabra, idx) =>
          `LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @palabra${idx}`
      )
      .join(" OR ");

    const request = pool.request();
    coincidencias.forEach((p, idx) =>
      request.input(`palabra${idx}`, sql.VarChar, `%${p}%`)
    );

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
      )}\n${mensaje}`,
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
