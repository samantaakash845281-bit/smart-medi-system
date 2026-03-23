const mysql = require('mysql2/promise');
require('dotenv').config();

const updateDoctorConfig = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db',
        });

        console.log("Checking DB columns...");
        const queries = [
            'ALTER TABLE users ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT 0',
            'ALTER TABLE users ADD COLUMN available_days VARCHAR(100) DEFAULT NULL',
            'ALTER TABLE users ADD COLUMN start_time TIME DEFAULT NULL',
            'ALTER TABLE users ADD COLUMN end_time TIME DEFAULT NULL'
        ];

        for (let q of queries) {
            try {
                await connection.query(q);
            } catch (e) {
                // Column probably already exists or syntax error. Safe to ignore.
            }
        }

        const doctorMocks = [
            {
                email: 'amit.kulkarni@smartmedi.com',
                fullName: 'Dr. Amit Kulkarni',
                role: 'doctor',
                status: 'active',
                phone: '1000000001',
                password: 'password123',
                available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
                start_time: '10:00:00',
                end_time: '17:00:00',
                specialization: 'Cardiologist',
                consultation_fee: 500
            },
            {
                email: 'neha.patil@smartmedi.com',
                fullName: 'Dr. Neha Patil',
                role: 'doctor',
                status: 'active',
                phone: '1000000002',
                password: 'password123',
                available_days: 'Tuesday,Wednesday,Thursday,Friday,Saturday',
                start_time: '11:00:00',
                end_time: '18:00:00',
                specialization: 'Neurologist',
                consultation_fee: 700
            },
            {
                email: 'rajesh.singh@smartmedi.com',
                fullName: 'Dr. Rajesh Singh',
                role: 'doctor',
                status: 'active',
                phone: '1000000003',
                password: 'password123',
                available_days: 'Monday,Wednesday,Friday',
                start_time: '09:00:00',
                end_time: '14:00:00',
                specialization: 'General Physician',
                consultation_fee: 300
            }
        ];

        const bcrypt = require('bcrypt');
        for (const doc of doctorMocks) {
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [doc.email]);
            if (existing.length > 0) {
                await connection.query(
                    'UPDATE users SET fullName=?, available_days=?, start_time=?, end_time=?, consultation_fee=?, specialization=?, status=? WHERE email=?',
                    [doc.fullName, doc.available_days, doc.start_time, doc.end_time, doc.consultation_fee, doc.specialization, doc.status, doc.email]
                );
            } else {
                try {
                    const hashedPassword = await bcrypt.hash(doc.password, 10);
                    await connection.query(
                        'INSERT INTO users (fullName, email, phone, password, role, status, available_days, start_time, end_time, specialization, consultation_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [doc.fullName, doc.email, doc.phone, hashedPassword, doc.role, doc.status, doc.available_days, doc.start_time, doc.end_time, doc.specialization, doc.consultation_fee]
                    );
                } catch (e) {
                    console.log('Error inserting: ' + doc.email, e.message);
                }
            }
        }

        console.log("Success: Doctors seeded/updated.");

        await connection.end();

    } catch (e) {
        console.error("Fatal Error:", e);
    }
};

updateDoctorConfig();
