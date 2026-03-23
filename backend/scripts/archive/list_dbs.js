const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkALL() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        const [dbs] = await connection.query('SHOW DATABASES');
        console.log('Databases:', dbs);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkALL();
