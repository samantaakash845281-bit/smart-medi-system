const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const doctorsData = [
    { name: 'Dr. Priya Sharma', specialization: 'Dermatology', email: 'drpriyasharma@smartmedi.com' },
    { name: 'Dr. Amit Patel', specialization: 'Cardiology', email: 'dramitpatel@smartmedi.com' },
    { name: 'Dr. Neha Kapoor', specialization: 'Pediatrics', email: 'drnehakapoor@smartmedi.com' },
    { name: 'Dr. Rahul Verma', specialization: 'Neurology', email: 'drrahulverma@smartmedi.com' },
    { name: 'Dr. Arjun Singh', specialization: 'Orthopedics', email: 'drarjunsingh@smartmedi.com' },
    { name: 'Dr. Meera Nair', specialization: 'General Physician', email: 'drmeeranair@smartmedi.com' },
    { name: 'Dr. Sneha Desai', specialization: 'Dermatology', email: 'drsnehadesai@smartmedi.com' },
    { name: 'Dr. Raj Malhotra', specialization: 'Cardiology', email: 'drrajmalhotra@smartmedi.com' }
];

const available_days = 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday';
const available_time_slots = '10:00 AM – 11:00 AM,11:00 AM – 12:00 PM,12:00 PM – 01:00 PM,01:00 PM – 02:00 PM,02:00 PM – 03:00 PM,03:00 PM – 04:00 PM,04:00 PM – 05:00 PM,05:00 PM – 06:00 PM,06:00 PM – 07:00 PM,07:00 PM – 08:00 PM,08:00 PM – 09:00 PM,09:00 PM – 10:00 PM,10:00 PM – 11:00 PM,11:00 PM – 12:00 AM';

async function initializeSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log("Connected to database. Initializing new schema with specific doctors...");

        // Disable foreign key checks to drop tables safely
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablesToDrop = ['payments', 'appointments', 'doctors', 'patients', 'admins', 'prescriptions', 'reports', 'notifications'];
        for (const table of tablesToDrop) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
        }

        console.log("Dropped existing tables.");

        // Table 1: admins
        await connection.query(`
            CREATE TABLE admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullName VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        // Table 1.5: patients
        await connection.query(`
            CREATE TABLE patients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullName VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'patient',
                status ENUM('active', 'pending', 'blocked') DEFAULT 'active',
                dob DATE,
                gender ENUM('male', 'female', 'other'),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        // Table 2: doctors
        await connection.query(`
            CREATE TABLE doctors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullName VARCHAR(100) NOT NULL,
                specialization VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                available_days TEXT,
                available_time_slots TEXT
            ) ENGINE=InnoDB
        `);

        // Table 3: appointments
        await connection.query(`
            CREATE TABLE appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                appointment_date DATE NOT NULL,
                time_slot VARCHAR(50) NOT NULL,
                status ENUM('pending', 'confirmed', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Table 4: payments
        await connection.query(`
            CREATE TABLE payments (
                payment_id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT,
                doctor_id INT,
                appointment_id INT NOT NULL,
                transaction_id VARCHAR(255) UNIQUE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'UPI',
                payment_status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expiry_time TIMESTAMP NULL,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
            ) ENGINE=InnoDB
        `);

        // Table 5: prescriptions
        await connection.query(`
            CREATE TABLE prescriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                appointment_id INT NOT NULL,
                doctor_id INT NOT NULL,
                patient_id INT NOT NULL,
                medicine_name VARCHAR(255) NOT NULL,
                dosage VARCHAR(100),
                instructions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Table 6: reports
        await connection.query(`
            CREATE TABLE reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                report_type VARCHAR(100) NOT NULL,
                report_file VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Table 7: notifications
        await connection.query(`
            CREATE TABLE notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                role ENUM('admin', 'doctor', 'patient') NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        console.log("Created all tables.");

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // Seed Admin User
        const adminEmail = 'admin@smms.com';
        const hashedPassword = await bcrypt.hash('password123', 10);
        await connection.query(
            'INSERT INTO admins (fullName, email, password) VALUES (?, ?, ?)',
            ['System Admin', adminEmail, hashedPassword]
        );
        console.log(`Seeded Admin user (${adminEmail} / password123)`);

        // Seed Doctors
        for (const doc of doctorsData) {
            await connection.query(
                'INSERT INTO doctors (fullName, specialization, email, password, available_days, available_time_slots) VALUES (?, ?, ?, ?, ?, ?)',
                [doc.name, doc.specialization, doc.email, hashedPassword, available_days, available_time_slots]
            );
        }
        console.log(`Seeded ${doctorsData.length} doctors with password123.`);

        // Seed a sample patient
        const patientEmail = 'john@smms.com';
        await connection.query(
            'INSERT INTO patients (fullName, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['John Doe', patientEmail, '1234567890', hashedPassword, 'patient', 'active']
        );
        console.log("Seeded sample patient (john@smms.com / password123)");

        console.log("Schema initialization complete.");
        process.exit(0);

    } catch (error) {
        console.error("Error during initialization:", error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

initializeSchema();
