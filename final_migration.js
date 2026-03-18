const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cafedb',
  });

  try {
    console.log('Running migration...');
    await connection.query('ALTER TABLE menu_items ADD COLUMN surcharge_large DECIMAL(10,2) DEFAULT 0.00');
    await connection.query('ALTER TABLE menu_items ADD COLUMN surcharge_extra_large DECIMAL(10,2) DEFAULT 0.00');
    console.log('Successfully added columns.');
    
    // Set some defaults for Espresso
    await connection.query('UPDATE menu_items SET surcharge_large = 0.50, surcharge_extra_large = 1.00 WHERE name = "Espresso"');
    console.log('Updated Espresso surcharges.');
    
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Migration failed:', err.message);
    }
  } finally {
    await connection.end();
  }
}

migrate();
 burial;
