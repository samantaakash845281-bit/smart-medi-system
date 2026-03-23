const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

async function updatePassword() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    const newPassword = 'password1234';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.query(
        "UPDATE users SET password = ? WHERE email = 'doctor@smartmedi.com'",
        [hashedPassword]
    );

    console.log("Password successfully updated to 'password1234' for doctor@smartmedi.com");
    process.exit(0);
}

updatePassword();
