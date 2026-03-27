const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function masterSeed() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'healthcare_system'
    });

    try {
        console.log('--- Final Master Seeding ---');
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        // 1. Ensure Admin
        await db.query('INSERT IGNORE INTO admins (admin_id, fullName, email, password) VALUES (1, "Super Admin", "admin@example.com", ?)', [password]);
        
        // 2. Ensure Doctors
        const doctorEmails = ['doctor9@gmail.com', 'doctor10@gmail.com', 'doctor11@gmail.com'];
        const doctorDetails = [
            ['Dr. Sarah Johnson', 'Cardiology'],
            ['Dr. Michael Chen', 'Neurology'],
            ['Dr. Emily Brown', 'Pediatrics']
        ];

        let doctorIds = [];
        for (let i = 0; i < doctorEmails.length; i++) {
            await db.query('INSERT IGNORE INTO doctors (fullName, email, password, specialization) VALUES (?, ?, ?, ?)', 
                [doctorDetails[i][0], doctorEmails[i], password, doctorDetails[i][1]]);
            const [doc] = await db.query('SELECT id FROM doctors WHERE email = ?', [doctorEmails[i]]);
            doctorIds.push(doc[0].id);
        }

        // 3. Ensure Patients
        const patientEmails = ['patient1@gmail.com', 'patient2@gmail.com', 'patient3@gmail.com'];
        let patientIds = [];
        for (let i = 0; i < patientEmails.length; i++) {
            await db.query('INSERT IGNORE INTO patients (fullName, email, password) VALUES (?, ?, ?)', 
                [`Patient ${i+1}`, patientEmails[i], password]);
            const [pat] = await db.query('SELECT id FROM patients WHERE email = ?', [patientEmails[i]]);
            patientIds.push(pat[0].id);
        }

        // 4. Seed Transactional Data
        console.log('Clearing old transactional data for these specific IDs to ensure fresh view...');
        await db.query('DELETE FROM appointments WHERE doctor_id IN (?) OR patient_id IN (?)', [doctorIds, patientIds]);
        
        for (let i = 0; i < 15; i++) {
            const dId = doctorIds[i % doctorIds.length];
            const pId = patientIds[i % patientIds.length];
            const date = new Date();
            date.setDate(date.getDate() + (i - 7));
            const formattedDate = date.toISOString().split('T')[0];
            const status = i < 5 ? 'completed' : 'confirmed';

            const [res] = await db.query(
                'INSERT INTO appointments (doctor_id, patient_id, appointment_date, time_slot, status) VALUES (?, ?, ?, "10:00 AM", ?)',
                [dId, pId, formattedDate, status]
            );
            const apptId = res.insertId;

            if (status === 'completed') {
                await db.query(
                    'INSERT IGNORE INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, medicines, notes) VALUES (?, ?, ?, "Routine Checkup", "{}", "Stable condition")',
                    [apptId, dId, pId]
                );
            }

            await db.query(
                'INSERT IGNORE INTO payments (appointment_id, doctor_id, patient_id, amount, payment_method, payment_status, transaction_id) VALUES (?, ?, ?, 500, "UPI", "paid", ?)',
                [apptId, dId, pId, `SM-TXN-${apptId}`]
            );
        }

        console.log('--- Final Master Seeding Complete ---');
    } catch (err) {
        console.error('Seeding Error:', err);
    } finally {
        await db.end();
    }
}

masterSeed();
