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

async function buscarProducto(producto, sucursal) {
  try {
    const pool = await sql.connect(config);

    const request = pool.request();
    request.input("producto", sql.VarChar, `%${producto}%`);

    let query = `
      SELECT 
        TABSU.NOKOSU AS SUCURSAL,
        MAEPR.NOKOPR AS NOMBRE_PRODUCTO,
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
        MAEPR.NOKOPR COLLATE Latin1_General_CI_AI LIKE @producto AND
        MAEST.STFI1 > 0
    `;

    if (sucursal) {
      request.input("sucursal", sql.VarChar, `%${sucursal}%`);
      query += ` AND TABSU.NOKOSU COLLATE Latin1_General_CI_AI LIKE @sucursal`;
    }

    query += " ORDER BY STOCK_FISICO DESC";

    const resultado = await request.query(query);
    const rows = resultado.recordset;

    if (rows.length === 0) {
      return {
        encontrado: false,
        mensaje: `⚠️ No se encontraron productos relacionados con: ${producto}${
          sucursal ? " en " + sucursal : ""
        }`,
      };
    }

    const mensaje = rows
      .map(
        (p) =>
          `🧰 ${p.SUCURSAL} ${
            p.NOMBRE_PRODUCTO
          } – $${p.PRECIO_BRUTO.toLocaleString("es-CL")} (${
            p.STOCK_FISICO
          } unidades en stock)`
      )
      .join("\n");

    return {
      encontrado: true,
      mensaje: `🔍 Productos encontrados relacionados con: ${producto}${
        sucursal ? " en " + sucursal : ""
      }\n${mensaje}`,
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
