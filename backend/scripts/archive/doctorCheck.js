const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

async function getOrCreateDoctor() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    let [doctors] = await connection.query("SELECT id, fullName, email FROM users WHERE role = 'doctor' AND status = 'active'");
    if (doctors.length > 0) {
        console.log(JSON.stringify({ found: true, email: doctors[0].email, msg: "Password is unknown (hashed), consider registering a new one if you forgot." }));
    } else {
        const hashedPassword = await bcrypt.hash('password1234', 10);
        await connection.query(
            "INSERT INTO users (fullName, email, phone, password, role, status) VALUES (?, ?, ?, ?, 'doctor', 'active')",
            ['Test Doctor', 'doctor@smartmedi.com', '9876543210', hashedPassword]
        );
        console.log(JSON.stringify({ found: false, email: 'doctor@smartmedi.com', password: 'DoctorPass123!', msg: "Created a new test doctor." }));
    }
    process.exit(0);
}

getOrCreateDoctor();
