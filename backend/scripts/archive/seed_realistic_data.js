const db = require('./config/db');
const bcrypt = require('bcrypt');

async function seedData() {
    try {
        console.log('--- Starting Comprehensive Data Seeding ---');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // 1. Seed Doctors (5 records)
        const doctorData = [
            ['Dr. Priya Sharma', 'dr.priya@smms.com', '9876543210', 'Cardiology', 12, 800, 'Mon, Wed, Fri', '10:00 AM - 04:00 PM', 'Female'],
            ['Dr. Amit Patel', 'dr.amit@smms.com', '9876543211', 'Neurology', 15, 1000, 'Tue, Thu, Sat', '09:00 AM - 03:00 PM', 'Male'],
            ['Dr. Neha Kapoor', 'dr.neha@smms.com', '9876543212', 'Pediatrics', 8, 600, 'Mon, Tue, Wed', '11:00 AM - 05:00 PM', 'Female'],
            ['Dr. Rahul Singh', 'dr.rahul@smms.com', '9876543213', 'Orthopedics', 10, 700, 'Wed, Thu, Fri', '02:00 PM - 08:00 PM', 'Male'],
            ['Dr. Sneha Reddy', 'dr.sneha@smms.com', '9876543214', 'Dermatology', 6, 500, 'Sat, Sun', '10:00 AM - 02:00 PM', 'Female']
        ];

        console.log('Seeding Doctors...');
        for (const doc of doctorData) {
            const [exists] = await db.query('SELECT doctor_id FROM doctors WHERE email = ?', [doc[1]]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO doctors (fullName, email, phone, specialization, experience, fees, available_days, available_time_slots, gender, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "doctor")',
                    [...doc, hashedPassword]
                );
            }
        }

        // 2. Seed Patients (8 records)
        const patientData = [
            ['Akash Samanta', 'akash@gmail.com', '8452811234', '1996-05-15', 'male'],
            ['John Doe', 'john@gmail.com', '8452811235', '1989-10-20', 'male'],
            ['Jane Smith', 'jane@gmail.com', '8452811236', '1994-03-12', 'female'],
            ['Rahul Verma', 'rahul.v@gmail.com', '8452811237', '1979-11-25', 'male'],
            ['Priya Iyer', 'priya.i@gmail.com', '8452811238', '1999-07-30', 'female'],
            ['Sandeep Singh', 'sandeep@gmail.com', '8452811239', '1974-12-05', 'male'],
            ['Anjali Gupta', 'anjali@gmail.com', '8452811240', '2002-01-15', 'female'],
            ['Vikram Rao', 'vikram@gmail.com', '8452811241', '1984-09-10', 'male']
        ];

        console.log('Seeding Patients...');
        for (const pat of patientData) {
            const [exists] = await db.query('SELECT patient_id FROM patients WHERE email = ?', [pat[1]]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO patients (fullName, email, phone, dob, gender, password, role, status) VALUES (?, ?, ?, ?, ?, ?, "patient", "active")',
                    [pat[0], pat[1], pat[2], pat[3], pat[4], hashedPassword]
                );
            }
        }

        // Fetch IDs for linking
        const [doctors] = await db.query('SELECT doctor_id FROM doctors');
        const [patients] = await db.query('SELECT patient_id FROM patients');

        // 3. Seed Appointments (15 records)
        console.log('Seeding Appointments...');
        const statuses = ['confirmed', 'completed', 'pending'];
        const timeSlots = ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];
        
        const today = new Date();
        for (let i = 0; i < 15; i++) {
            const docId = doctors[i % doctors.length].doctor_id;
            const patId = patients[i % patients.length].patient_id;
            const status = statuses[i % statuses.length];
            const time = timeSlots[i % timeSlots.length];
            
            const appointmentDate = new Date();
            appointmentDate.setDate(today.getDate() + (i - 7)); // Spread across past and future
            const formattedDate = appointmentDate.toISOString().split('T')[0];

            await db.query(
                'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, status) VALUES (?, ?, ?, ?, ?)',
                [patId, docId, formattedDate, time, status]
            );
        }

        // Fetch Appointment IDs
        const [appts] = await db.query('SELECT appointment_id, patient_id, doctor_id FROM appointments ORDER BY appointment_id DESC LIMIT 15');

        // 4. Seed Prescriptions (10 records)
        console.log('Seeding Prescriptions...');
        const medicines = [
            [{ name: 'Paracetamol', dosage: '500mg', frequency: 'Twice a day', instructions: 'After meals' }],
            [{ name: 'Amoxicillin', dosage: '250mg', frequency: 'Thrice a day', instructions: 'Continue for 5 days' }],
            [{ name: 'Ibuprofen', dosage: '400mg', frequency: 'When needed', instructions: 'For pain relief' }]
        ];

        for (let i = 0; i < 10; i++) {
            const appt = appts[i];
            await db.query(
                'INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, symptoms, diagnosis, medicines, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [appt.patient_id, appt.doctor_id, appt.appointment_id, 'Fever, Cough', 'Viral Infection', JSON.stringify(medicines[i % 3]), 'Rest well and drink plenty of fluids.']
            );
        }

        // 5. Seed Payments (10 records)
        console.log('Seeding Payments...');
        for (let i = 0; i < 10; i++) {
            const appt = appts[i];
            const amount = 500 + (i * 50);
            await db.query(
                'INSERT INTO payments (patient_id, doctor_id, appointment_id, amount, payment_method, payment_status, transaction_id) VALUES (?, ?, ?, ?, "UPI", "paid", ?)',
                [appt.patient_id, appt.doctor_id, appt.appointment_id, amount, `TXN-SEED-${1000 + i}`]
            );
        }

        console.log('--- Seeding Complete Successfully ---');
    } catch (error) {
        console.error('Seeding Failed:', error);
    } finally {
        process.exit(0);
    }
}

seedData();
