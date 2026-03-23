const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function repairIdentities() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'healthcare_system'
    });

    try {
        console.log('--- Starting Identity Repair & Sync ---');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // 1. Repair Doctors
        console.log('Repairing Doctor identities...');
        const [doctors] = await db.query('SELECT doctor_id, email, fullName FROM doctors');
        for (const doc of doctors) {
            let userId;
            const [users] = await db.query('SELECT user_id FROM users WHERE email = ?', [doc.email]);
            
            if (users.length === 0) {
                console.log(`Creating user for doctor: ${doc.email}`);
                const [result] = await db.query(
                    'INSERT INTO users (email, password, role) VALUES (?, ?, "doctor")',
                    [doc.email, hashedPassword]
                );
                userId = result.insertId;
            } else {
                userId = users[0].user_id;
                // Ensure role is correct
                await db.query('UPDATE users SET role = "doctor" WHERE user_id = ?', [userId]);
            }

            await db.query('UPDATE doctors SET user_id = ? WHERE doctor_id = ?', [userId, doc.doctor_id]);
        }

        // 2. Repair Patients
        console.log('Repairing Patient identities...');
        const [patients] = await db.query('SELECT patient_id, email, fullName FROM patients');
        for (const pat of patients) {
            let userId;
            const [users] = await db.query('SELECT user_id FROM users WHERE email = ?', [pat.email]);
            
            if (users.length === 0) {
                console.log(`Creating user for patient: ${pat.email}`);
                const [result] = await db.query(
                    'INSERT INTO users (email, password, role) VALUES (?, ?, "patient")',
                    [pat.email, hashedPassword]
                );
                userId = result.insertId;
            } else {
                userId = users[0].user_id;
                await db.query('UPDATE users SET role = "patient" WHERE user_id = ?', [userId]);
            }

            await db.query('UPDATE patients SET user_id = ? WHERE patient_id = ?', [userId, pat.patient_id]);
        }

        // 3. Ensure Admin
        console.log('Ensuring Admin user exists...');
        const [admin] = await db.query('SELECT user_id FROM users WHERE email = "admin@example.com"');
        if (admin.length === 0) {
            await db.query(
                'INSERT INTO users (email, password, role) VALUES ("admin@example.com", ?, "admin")',
                [hashedPassword]
            );
            console.log('Admin user created (admin@example.com / password123)');
        }

        console.log('--- Identity Repair Complete ---');
    } catch (err) {
        console.error('Repair Failed:', err);
    } finally {
        await db.end();
    }
}

repairIdentities();
