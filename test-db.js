const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cafedb',
    });
    
    const [rows] = await pool.query('SELECT 1 as val');
    console.log('Database connection successful:', rows);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
