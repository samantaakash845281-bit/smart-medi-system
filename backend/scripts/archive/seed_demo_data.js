const db = require('./config/db');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        console.log('Starting data seeding...');

        // 1. Seed Doctors
        const doctors = [
            {
                fullName: 'Dr. Sarah Connor',
                email: 'sarah.connor@example.com',
                password: 'password123',
                specialization: 'Neurology',
                experience: '12 years',
                phone: '+1-555-0101',
                available_days: 'Mon, Tue, Wed, Fri',
                available_time_slots: '09:00 AM - 01:00 PM, 03:00 PM - 06:00 PM'
            },
            {
                fullName: 'Dr. James Smith',
                email: 'james.smith@example.com',
                password: 'password123',
                specialization: 'Cardiology',
                experience: '15 years',
                phone: '+1-555-0102',
                available_days: 'Mon, Thu, Sat',
                available_time_slots: '10:00 AM - 02:00 PM'
            },
            {
                fullName: 'Dr. Elena Gilbert',
                email: 'elena.gilbert@example.com',
                password: 'password123',
                specialization: 'Pediatrics',
                experience: '8 years',
                phone: '+1-555-0103',
                available_days: 'Mon, Wed, Fri',
                available_time_slots: '08:00 AM - 12:00 PM, 02:00 PM - 05:00 PM'
            }
        ];

        for (const doc of doctors) {
            const [exists] = await db.query('SELECT * FROM doctors WHERE email = ?', [doc.email]);
            if (exists.length === 0) {
                const hashedPassword = await bcrypt.hash(doc.password, 10);
                await db.query(`
                    INSERT INTO doctors (fullName, email, password, specialization, experience, phone, available_days, available_time_slots) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [doc.fullName, doc.email, hashedPassword, doc.specialization, doc.experience, doc.phone, doc.available_days, doc.available_time_slots]);
                console.log(`Added doctor: ${doc.fullName}`);
            }
        }

        // 2. Seed Patients
        const patients = [
            {
                fullName: 'Alice Johnson',
                email: 'alice.j@example.com',
                phone: '+1-555-0201',
                dob: '1990-05-15',
                gender: 'female',
                address: '123 Maple St, Springfield'
            },
            {
                fullName: 'Bob Williams',
                email: 'bob.w@example.com',
                phone: '+1-555-0202',
                dob: '1985-08-22',
                gender: 'male',
                address: '456 Oak Ave, Riverdale'
            }
        ];

        for (const pat of patients) {
            const [exists] = await db.query('SELECT * FROM patients WHERE email = ?', [pat.email]);
            if (exists.length === 0) {
                await db.query(`
                    INSERT INTO patients (fullName, email, phone, dob, gender, address) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [pat.fullName, pat.email, pat.phone, pat.dob, pat.gender, pat.address]);
                console.log(`Added patient: ${pat.fullName}`);
            }
        }

        // 3. Seed some Appointments to make the detail pages look good
        const [docRows] = await db.query('SELECT doctor_id FROM doctors LIMIT 1');
        const [patRows] = await db.query('SELECT patient_id FROM patients LIMIT 1');

        if (docRows.length > 0 && patRows.length > 0) {
            const docId = docRows[0].doctor_id;
            const patId = patRows[0].patient_id;

            const [appts] = await db.query('SELECT * FROM appointments WHERE doctor_id = ? AND patient_id = ?', [docId, patId]);
            if (appts.length === 0) {
                await db.query(`
                    INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status, purpose) 
                    VALUES (?, ?, CURDATE(), '10:00 AM', 'confirmed', 'Regular Checkup')
                `, [patId, docId]);
                console.log('Added demo appointment');
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
