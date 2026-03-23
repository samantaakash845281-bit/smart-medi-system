const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const doctors = [
    { name: 'Dr. Amit Sharma', specialization: 'Cardiology', experience: '10 Years', fee: 500, email: 'amit@smartmedi.com', phone: '9876543001', available_days: 'Monday,Wednesday,Friday', start_time: '09:00:00', end_time: '17:00:00' },
    { name: 'Dr. Priya Mehta', specialization: 'Dermatology', experience: '7 Years', fee: 400, email: 'priya@smartmedi.com', phone: '9876543002', available_days: 'Tuesday,Thursday,Saturday', start_time: '10:00:00', end_time: '18:00:00' },
    { name: 'Dr. Rahul Verma', specialization: 'Orthopedics', experience: '12 Years', fee: 600, email: 'rahul@smartmedi.com', phone: '9876543003', available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday', start_time: '09:00:00', end_time: '20:00:00' },
    { name: 'Dr. Neha Singh', specialization: 'Pediatrics', experience: '8 Years', fee: 450, email: 'neha@smartmedi.com', phone: '9876543004', available_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', start_time: '08:00:00', end_time: '15:00:00' }
];

async function seedDoctors() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    console.log(`Connected to database: ${process.env.DB_NAME}`);

    const password = 'Password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    for (const doc of doctors) {
        // Check if doctor already exists
        const [existing] = await connection.query("SELECT id FROM users WHERE email = ?", [doc.email]);

        if (existing.length > 0) {
            console.log(`Doctor ${doc.name} (${doc.email}) already exists. Updating...`);
            await connection.query(
                "UPDATE users SET fullName = ?, specialization = ?, experience = ?, consultation_fee = ?, available_days = ?, start_time = ?, end_time = ?, role = 'doctor', status = 'active' WHERE email = ?",
                [doc.name, doc.specialization, doc.experience, doc.fee, doc.available_days, doc.start_time, doc.end_time, doc.email]
            );
        } else {
            console.log(`Inserting ${doc.name}...`);
            await connection.query(
                "INSERT INTO users (fullName, email, phone, password, role, status, specialization, experience, consultation_fee, available_days, start_time, end_time) VALUES (?, ?, ?, ?, 'doctor', 'active', ?, ?, ?, ?, ?, ?)",
                [doc.name, doc.email, doc.phone, hashedPassword, doc.specialization, doc.experience, doc.fee, doc.available_days, doc.start_time, doc.end_time]
            );
        }
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
}

seedDoctors().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
