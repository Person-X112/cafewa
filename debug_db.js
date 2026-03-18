const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafedb',
  });

  try {
    const [rows] = await pool.query("SELECT 1 + 1");
    console.log("Rows:", JSON.stringify(rows, null, 2));
    console.log("rows[0]:", rows[0]);
    console.log("rows[0][1]:", rows[0][1]);
    console.log("result of (rows[0][1] !== 2):", (rows[0][1] !== 2));
    
    // Test alternative access
    const key = Object.keys(rows[0])[0];
    console.log("Value by key:", rows[0][key]);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await pool.end();
  }
}

test();
