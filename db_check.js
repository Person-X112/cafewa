const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function check() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafedb',
  };
  
  console.log('Connecting to:', config.host, config.database);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected!');
    
    // Check columns
    const [columns] = await connection.query('SHOW COLUMNS FROM menu_items');
    console.log('Columns in menu_items:');
    columns.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
    
    // Check if Espresso has surcharges
    const [items] = await connection.query('SELECT name, price, surcharge_large, surcharge_extra_large FROM menu_items WHERE name = "Espresso"');
    console.log('Espresso Data:', JSON.stringify(items));
    
    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

check();
