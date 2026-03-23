const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    try {
        console.log('--- USERS TABLE ---');
        const [userCols] = await connection.query('DESCRIBE users');
        console.table(userCols);

        console.log('--- DOCTORS TABLE ---');
        const [docCols] = await connection.query('DESCRIBE doctors');
        console.table(docCols);

        console.log('--- DOCTOR USERS ---');
        const [doctors] = await connection.query("SELECT id, fullName, email, role FROM users WHERE role = 'doctor'");
        console.table(doctors);

        if (doctors.length === 0) {
            console.log('No doctors found in users table. Checking doctors table...');
            const [docs] = await connection.query("SELECT * FROM doctors");
            console.table(docs);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
