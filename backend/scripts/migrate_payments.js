const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const updatePaymentSchemaAndSeed = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log('Connected to MySQL. Updating payments table schema...');

        // 1. Add new columns
        const columnsToAdd = [
            "ADD COLUMN upi_id VARCHAR(255) DEFAULT NULL",
            "ADD COLUMN expiry_time DATETIME DEFAULT NULL"
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.query(`ALTER TABLE payments ${col};`);
                console.log(`Successfully executed: ALTER TABLE payments ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping: ${col}`);
                } else {
                    console.error(`Error adding column: ${err.message}`);
                }
            }
        }

        console.log('--- Checking Demo Data Seeding ---');

        // 2. Insert Demo Doctors
        const hashedPassword = await bcrypt.hash('password123', 10);

        const doctors = [
            { name: 'Dr. Amit Kulkarni', email: 'amit@smartmedi.com', phone: '9888877777', spec: 'Cardiologist', role: 'doctor' },
            { name: 'Dr. Neha Patil', email: 'neha@smartmedi.com', phone: '9111122222', spec: 'Dermatologist', role: 'doctor' }
        ];

        for (const doc of doctors) {
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [doc.email]);
            if (existing.length === 0) {
                await connection.query(
                    `INSERT INTO users (fullName, email, phone, password, role, status, specialization) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
                    [doc.name, doc.email, doc.phone, hashedPassword, doc.role, doc.spec]
                );
                console.log(`Seeded Doctor: ${doc.name}`);
            }
        }

        // 3. Insert Demo Patients
        const patients = [
            { name: 'Rahul Sharma', email: 'rahul@gmail.com', phone: '9999988888', role: 'patient' },
            { name: 'Priya Mehta', email: 'priya@gmail.com', phone: '9777766666', role: 'patient' }
        ];

        for (const pat of patients) {
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [pat.email]);
            if (existing.length === 0) {
                await connection.query(
                    `INSERT INTO users (fullName, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')`,
                    [pat.name, pat.email, pat.phone, hashedPassword, pat.role]
                );
                console.log(`Seeded Patient: ${pat.name}`);
            }
        }

        // 4. Fetch IDs for Relationships
        const [amit] = await connection.query('SELECT id FROM users WHERE email = ?', ['amit@smartmedi.com']);
        const [neha] = await connection.query('SELECT id FROM users WHERE email = ?', ['neha@smartmedi.com']);
        const [rahul] = await connection.query('SELECT id FROM users WHERE email = ?', ['rahul@gmail.com']);
        const [priya] = await connection.query('SELECT id FROM users WHERE email = ?', ['priya@gmail.com']);

        if (amit.length && neha.length && rahul.length && priya.length) {
            // 5. Insert Appointments
            const [rahulApptCheck] = await connection.query('SELECT id FROM appointments WHERE patient_id = ? AND doctor_id = ?', [rahul[0].id, amit[0].id]);
            let rahulApptId;
            if (rahulApptCheck.length === 0) {
                const [apptRes1] = await connection.query(
                    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, CURDATE() + INTERVAL 1 DAY, '10:00:00', 'approved')`,
                    [rahul[0].id, amit[0].id]
                );
                rahulApptId = apptRes1.insertId;
                console.log('Seeded Appointment for Rahul Sharma -> Dr. Amit Kulkarni');
            } else {
                rahulApptId = rahulApptCheck[0].id;
            }

            const [priyaApptCheck] = await connection.query('SELECT id FROM appointments WHERE patient_id = ? AND doctor_id = ?', [priya[0].id, neha[0].id]);
            let priyaApptId;
            if (priyaApptCheck.length === 0) {
                const [apptRes2] = await connection.query(
                    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status) VALUES (?, ?, CURDATE() + INTERVAL 2 DAY, '14:30:00', 'approved')`,
                    [priya[0].id, neha[0].id]
                );
                priyaApptId = apptRes2.insertId;
                console.log('Seeded Appointment for Priya Mehta -> Dr. Neha Patil');
            } else {
                priyaApptId = priyaApptCheck[0].id;
            }

            // 6. Insert Pending Payments
            const [rahulPayCheck] = await connection.query('SELECT id FROM payments WHERE appointment_id = ?', [rahulApptId]);
            if (rahulPayCheck.length === 0) {
                await connection.query(
                    `INSERT INTO payments (patient_id, doctor_id, appointment_id, amount, payment_method, transaction_id, payment_status, expiry_time) 
                     VALUES (?, ?, ?, ?, ?, ?, 'Pending', DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
                    [rahul[0].id, amit[0].id, rahulApptId, 500.00, 'UPI', `SM2026TXN${Math.floor(1000 + Math.random() * 9000)}`]
                );
                console.log('Seeded Pending Payment: Rahul (₹500)');
            }

            const [priyaPayCheck] = await connection.query('SELECT id FROM payments WHERE appointment_id = ?', [priyaApptId]);
            if (priyaPayCheck.length === 0) {
                await connection.query(
                    `INSERT INTO payments (patient_id, doctor_id, appointment_id, amount, payment_method, transaction_id, payment_status, expiry_time) 
                     VALUES (?, ?, ?, ?, ?, ?, 'Pending', DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
                    [priya[0].id, neha[0].id, priyaApptId, 800.00, 'UPI', `SM2026TXN${Math.floor(1000 + Math.random() * 9000)}`]
                );
                console.log('Seeded Pending Payment: Priya (₹800)');
            }
        }

        console.log('--- Migration and Seeding Complete ---');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updatePaymentSchemaAndSeed();
