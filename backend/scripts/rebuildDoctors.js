const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const doctors = [
    { name: 'Dr. Priya Sharma', department: 'Cardiology', experience: '10 years', fees: 700 },
    { name: 'Dr. Amit Patel', department: 'Cardiology', experience: '8 years', fees: 600 },
    { name: 'Dr. Neha Kapoor', department: 'Dermatology', experience: '6 years', fees: 500 },
    { name: 'Dr. Rahul Verma', department: 'Dermatology', experience: '9 years', fees: 550 },
    { name: 'Dr. Arjun Singh', department: 'Orthopedics', experience: '12 years', fees: 750 },
    { name: 'Dr. Meera Nair', department: 'Neurology', experience: '11 years', fees: 800 },
    { name: 'Dr. Sneha Desai', department: 'Pediatrics', experience: '8 years', fees: 500 },
    { name: 'Dr. Raj Malhotra', department: 'General Physician', experience: '14 years', fees: 400 }
];

async function rebuildDoctors() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log("Connected to database. Starting complete doctor rebuild synchronization...");

        // 1. Delete all existing appointments to prevent foreign key constraint failures during doctor deletion
        await connection.query("DELETE FROM appointments");
        console.log("Cleared existing appointments to prevent FK errors.");

        // 2. Delete all existing doctors from BOTH tables
        await connection.query("DELETE FROM doctors");
        await connection.query("DELETE FROM users WHERE role = 'doctor'");
        console.log("Cleared all existing doctor records from 'doctors' and 'users' tables.");

        // We want to force the IDs to be identical. Let's get the starting auto-increment value.
        const [userAI] = await connection.query("SELECT AUTO_INCREMENT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'smartmedi_db'");
        let nextUserId = userAI[0].AUTO_INCREMENT;

        // Reset doctors auto increment to match users to be absolutely safe, 
        // though strictly we'll just use the insert ID from users.
        await connection.query(`ALTER TABLE doctors AUTO_INCREMENT = ${nextUserId}`);

        const hashedPassword = await bcrypt.hash('password123', 10);

        for (let i = 0; i < doctors.length; i++) {
            const doc = doctors[i];
            const email = doc.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@smartmedi.com';
            const phone = '98765' + String(i).padStart(5, '0'); // Unique dummy phone

            console.log(`Synchronizing ${doc.name}...`);

            // Insert into Users table first to generate the Master ID
            const [userResult] = await connection.query(
                "INSERT INTO users (fullName, email, phone, password, role, status) VALUES (?, ?, ?, ?, 'doctor', 'active')",
                [doc.name, email, phone, hashedPassword]
            );

            const masterId = userResult.insertId;

            // Insert into Doctors table WITH THE EXACT SAME ID
            await connection.query(
                "INSERT INTO doctors (id, name, department, experience, fees, availability) VALUES (?, ?, ?, ?, ?, 'Available')",
                [masterId, doc.name, doc.department, doc.experience, doc.fees]
            );

            console.log(`  -> Successfully synced with Master ID: ${masterId}`);
        }

        console.log("Database synchronization complete. 8 doctors perfectly mirrored.");

    } catch (error) {
        console.error("Critical error during rebuild:", error);
    } finally {
        if (connection) await connection.end();
    }
}

rebuildDoctors();
