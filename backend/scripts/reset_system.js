const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetSystem() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    console.log('--- Cleaning Database ---');

    // Disable foreign key checks for truncation
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE appointments');
    await connection.query('TRUNCATE TABLE doctors');
    await connection.query('TRUNCATE TABLE admins');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Tables truncated: appointments, doctors, admins');

    // Ensure appointments table has correct columns
    console.log('--- Checking Appointments Schema ---');
    const [appCols] = await connection.query('DESCRIBE appointments');
    const colNames = appCols.map(c => c.Field);

    if (!colNames.includes('patient_name')) {
        await connection.query('ALTER TABLE appointments ADD COLUMN patient_name VARCHAR(100) AFTER patient_id');
        console.log('Added patient_name to appointments');
    }
    if (!colNames.includes('doctor_name')) {
        await connection.query('ALTER TABLE appointments ADD COLUMN doctor_name VARCHAR(100) AFTER doctor_id');
        console.log('Added doctor_name to appointments');
    }
    if (colNames.includes('status') && !colNames.includes('booking_status')) {
        await connection.query('ALTER TABLE appointments CHANGE COLUMN status booking_status VARCHAR(50) DEFAULT "Pending"');
        console.log('Renamed status to booking_status in appointments');
    } else if (!colNames.includes('booking_status')) {
        await connection.query('ALTER TABLE appointments ADD COLUMN booking_status VARCHAR(50) DEFAULT "Pending"');
        console.log('Added booking_status to appointments');
    }

    // Hash password
    const passwordHash = await bcrypt.hash('password123', 10);

    // Doctors Data
    const doctors = [
        ['Dr. Priya Sharma', 'drpriyasharma@smartmedi.com', passwordHash, 'Dermatology', '10 Years', 500, 'Available'],
        ['Dr. Amit Patel', 'dramitpatel@smartmedi.com', passwordHash, 'Cardiology', '12 Years', 700, 'Available'],
        ['Dr. Neha Kapoor', 'drnehakapoor@smartmedi.com', passwordHash, 'Pediatrics', '8 Years', 400, 'Available'],
        ['Dr. Rahul Verma', 'drrahulverma@smartmedi.com', passwordHash, 'Neurology', '15 Years', 800, 'Available'],
        ['Dr. Arjun Singh', 'drarjunsingh@smartmedi.com', passwordHash, 'Orthopedics', '9 Years', 600, 'Available'],
        ['Dr. Meera Nair', 'drmeeranair@smartmedi.com', passwordHash, 'General Physician', '7 Years', 300, 'Available'],
        ['Dr. Sneha Desai', 'drsnehadesai@smartmedi.com', passwordHash, 'Dermatology', '6 Years', 450, 'Available'],
        ['Dr. Raj Malhotra', 'drrajmalhotra@smartmedi.com', passwordHash, 'Cardiology', '11 Years', 650, 'Available']
    ];

    console.log('--- Seeding Doctors ---');
    for (const doc of doctors) {
        await connection.query(
            'INSERT INTO doctors (name, email, password, department, experience, fees, availability) VALUES (?, ?, ?, ?, ?, ?, ?)',
            doc
        );
        console.log(`Seeded: ${doc[0]}`);
    }

    console.log('--- Seeding Admin ---');
    await connection.query(
        'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
        ['System Admin', 'admin@smartmedi.com', passwordHash]
    );
    console.log('Seeded: System Admin (admin@smartmedi.com)');

    console.log('--- System Reset Complete ---');
    await connection.end();
}

resetSystem().catch(err => {
    console.error('Error resetting system:', err);
    process.exit(1);
});
