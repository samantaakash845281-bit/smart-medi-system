const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function listUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    const [users] = await connection.query('SELECT id, fullName, email, role, status FROM users');
    console.log(users);
    process.exit(0);
}

listUsers();
