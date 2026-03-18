const mysql = require('mysql2/promise');

async function checkSchema() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafedb',
  });

  try {
    const [rows] = await pool.query("DESC users");
    console.log("Users table schema:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Failed to check schema:", err);
  } finally {
    await pool.end();
  }
}

checkSchema();
