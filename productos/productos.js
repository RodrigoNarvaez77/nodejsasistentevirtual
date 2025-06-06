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

    // 1️⃣ Limpiar frase y separar palabras
    const palabras = consulta
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
      .split(/\s+/);

    // 2️⃣ Palabras irrelevantes (stopwords)
    const stopwords = new Set([
      "el",
      "la",
      "los",
      "las",
      "un",
      "una",
      "unos",
      "unas",
      "de",
      "del",
      "al",
      "por",
      "para",
      "con",
      "en",
      "a",
      "hola",
      "me",
      "te",
      "lo",
      "le",
      "les",
      "que",
      "cuanto",
      "cual",
      "procio",
      "precio",
      "dime",
      "decir",
      "hay",
      "si",
      "y",
      "yo",
      ".",
      ",",
      "tu",
      "usted",
      "quiero",
      "busco",
      "valor",
      "cuesta",
      "consulta",
      "informacion",
      "producto",
    ]);

    const palabrasFiltradas = palabras.filter((p) => !stopwords.has(p));

    let palabraClave = null;

    // 3️⃣ Buscar palabra clave válida en productos
    for (const palabra of palabrasFiltradas) {
      const result = await pool
        .request()
        .input("consulta", sql.VarChar, `%${palabra}%`).query(`
          SELECT TOP 1 NOKOPR 
          FROM MAEPR 
          WHERE LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @consulta
        `);

      if (result.recordset.length > 0) {
        palabraClave = palabra;
        break;
      }
    }

    // 4️⃣ Si no se encontró ninguna palabra válida
    if (!palabraClave) {
      return {
        encontrado: false,
        mensaje: "❌ No se reconoció ningún producto en tu consulta.",
      };
    }

    // 5️⃣ Consulta principal con palabra clave detectada
    const productos = await pool
      .request()
      .input("consulta", sql.VarChar, `%${palabraClave}%`).query(`
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
          LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @consulta
        ORDER BY STOCK_FISICO DESC;
      `);

    const rows = productos.recordset;

    if (rows.length === 0) {
      return {
        encontrado: false,
        mensaje: `⚠️ No se encontraron productos relacionados con "${palabraClave}".`,
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
      mensaje: `🔍 Productos encontrados relacionados con "${palabraClave}":\n${mensaje}`,
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
