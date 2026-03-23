const mysql = require('mysql2/promise');
require('dotenv').config();

async function listDocs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    const [docs] = await connection.query('SELECT id, name, email FROM doctors');
    console.log('--- DOCTORS ---');
    console.table(docs);

    await connection.end();
}
listDocs().catch(console.error);
