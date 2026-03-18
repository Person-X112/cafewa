const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafedb',
  });

  try {
    console.log('Adding surcharge columns to menu_items...');
    await connection.query(`
      ALTER TABLE menu_items 
      ADD COLUMN surcharge_large DECIMAL(10,2) DEFAULT 0.00,
      ADD COLUMN surcharge_extra_large DECIMAL(10,2) DEFAULT 0.00;
    `);
    console.log('Success!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    await connection.end();
  }
}

migrate();
