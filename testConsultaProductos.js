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

async function testConsulta(consulta) {
  try {
    await sql.connect(config);

    const result = await sql.query(`
      SELECT 
        KOSU AS SUCURSAL, 
        KOBO AS BODEGA,
        MAEST.KOPR AS CODIGO_PRODUCTO,
        NOKOPR AS NOMBRE_PRODUCTO,
        MAEST.STFI1 AS STOCK_FISICO, 
        PM,
        PP01UD AS PRECIO_BRUTO 
      FROM MAEST
      INNER JOIN MAEPR ON MAEPR.KOPR = MAEST.KOPR
      INNER JOIN TABPRE PBRUTO ON PBRUTO.KOPR = MAEPR.KOPR
      ORDER BY STOCK_FISICO DESC
    `);

    console.log("🔍 Resultados:");
    result.recordset.forEach((p) => {
      console.log(
        `🧰 ${p.NOMBRE_PRODUCTO} – $${p.PRECIO_BRUTO} (${p.STOCK_FISICO} en stock)`
      );
    });

    sql.close();
  } catch (err) {
    console.error("❌ Error al ejecutar la consulta:", err);
  }
}

// Ejecutar prueba
testConsulta();
