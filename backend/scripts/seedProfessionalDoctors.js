const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const doctors = [
    { name: 'Dr. Priya Sharma', department: 'Cardiology', experience: '10 Years', fees: 700, availability: 'Available' },
    { name: 'Dr. Amit Patel', department: 'Cardiology', experience: '8 Years', fees: 600, availability: 'Available' },
    { name: 'Dr. Neha Kapoor', department: 'Dermatology', experience: '6 Years', fees: 500, availability: 'Available' },
    { name: 'Dr. Rahul Verma', department: 'Dermatology', experience: '9 Years', fees: 550, availability: 'Available' },
    { name: 'Dr. Arjun Singh', department: 'Orthopedics', experience: '12 Years', fees: 750, availability: 'Available' },
    { name: 'Dr. Kavita Joshi', department: 'Orthopedics', experience: '7 Years', fees: 650, availability: 'Available' },
    { name: 'Dr. Meera Nair', department: 'Neurology', experience: '11 Years', fees: 800, availability: 'Available' },
    { name: 'Dr. Rakesh Gupta', department: 'Neurology', experience: '9 Years', fees: 750, availability: 'Available' },
    { name: 'Dr. Sneha Desai', department: 'Pediatrics', experience: '8 Years', fees: 500, availability: 'Available' },
    { name: 'Dr. Anil Kumar', department: 'Pediatrics', experience: '15 Years', fees: 600, availability: 'Available' },
    { name: 'Dr. Raj Malhotra', department: 'General Physician', department: 'General Physician', experience: '14 Years', fees: 400, availability: 'Available' }
];

async function seedProfessionalDoctors() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    console.log(`Connected to database: ${process.env.DB_NAME}`);

    // Clear existing doctors to avoid duplicates and match new structure
    await connection.query("DELETE FROM doctors");
    console.log("Cleared existing doctors.");

    for (const doc of doctors) {
        console.log(`Inserting ${doc.name}...`);
        await connection.query(
            "INSERT INTO doctors (name, department, experience, fees, availability) VALUES (?, ?, ?, ?, ?)",
            [doc.name, doc.department, doc.experience, doc.fees, doc.availability]
        );
    }

    console.log("Seeding of professional doctors completed successfully.");
    process.exit(0);
}

seedProfessionalDoctors().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
