const mysql = require('mysql2/promise');
require('dotenv').config();

const checkSchema = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartmedi_db'
  });

  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables:', tables);

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\nSchema for table: ${tableName}`);
      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      console.table(columns);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
};

checkSchema();
