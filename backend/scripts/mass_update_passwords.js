const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function updatePasswords() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        console.log(`Updating all passwords to: ${newPassword}`);

        // Update users table
        const [userUpdate] = await connection.query("UPDATE users SET password = ?", [hashedPassword]);
        console.log(`Updated ${userUpdate.affectedRows} users.`);

        // Update doctors table
        const [doctorUpdate] = await connection.query("UPDATE doctors SET password = ?", [hashedPassword]);
        console.log(`Updated ${doctorUpdate.affectedRows} doctors.`);

        // Fetch all users to display
        const [users] = await connection.query("SELECT name, email, role FROM users");
        const [doctors] = await connection.query("SELECT doctor_name, email, specialization FROM doctors");

        console.log("\n--- USER LIST ---");
        users.forEach(u => console.log(`Role: ${u.role.padEnd(8)} | Name: ${u.name.padEnd(20)} | Email: ${u.email}`));

        console.log("\n--- DOCTOR LIST ---");
        doctors.forEach(d => console.log(`Specialty: ${d.specialization.padEnd(15)} | Name: ${d.doctor_name.padEnd(20)} | Email: ${d.email}`));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

updatePasswords();
