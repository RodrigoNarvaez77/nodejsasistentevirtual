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

    const consultaLimpia = consulta.trim().toLowerCase();

    const result = await pool
      .request()
      .input("consulta", sql.VarChar, `%${consultaLimpia}%`).query(`
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
  MAEST.KOPR NOT LIKE '%ZZ%' AND  MAEST.KOSU not like '901' AND
  LOWER(NOKOPR) COLLATE Latin1_General_CI_AI LIKE @consulta
ORDER BY STOCK_FISICO DESC;
      `);

    const rows = result.recordset;

    if (rows.length === 0) return { encontrado: false };

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
      mensaje: `🔍 Productos encontrados:\n${mensaje}`,
    };
  } catch (err) {
    console.error("❌ Error al buscar producto:", err);
    return { encontrado: false };
  } finally {
    sql.close();
  }
}

module.exports = buscarProducto;
