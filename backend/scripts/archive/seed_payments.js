const db = require('./config/db');

async function seed() {
    try {
        console.log("Seeding sample payments...");

        // 1. Get some existing appointments
        const [appts] = await db.query('SELECT appointment_id, patient_id, doctor_id, amount FROM appointments LIMIT 5');
        
        if (appts.length === 0) {
            console.log("No appointments found. Please book some appointments first.");
            process.exit(0);
        }

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const samplePayments = [
            {
                patient_id: appts[0].patient_id,
                doctor_id: appts[0].doctor_id,
                appointment_id: appts[0].appointment_id,
                amount: 500.00,
                payment_method: 'UPI',
                transaction_id: '123456789012',
                payment_status: 'pending',
                payment_date: now
            },
            {
                patient_id: appts[1]?.patient_id || appts[0].patient_id,
                doctor_id: appts[1]?.doctor_id || appts[0].doctor_id,
                appointment_id: appts[1]?.appointment_id || 10, // Try 10 if 1 is missing
                amount: 750.00,
                payment_method: 'Gateway',
                transaction_id: 'pay_ABC123XYZ',
                payment_status: 'Paid',
                payment_date: now
            },
            {
                patient_id: appts[2]?.patient_id || appts[0].patient_id,
                doctor_id: appts[2]?.doctor_id || appts[0].doctor_id,
                appointment_id: appts[2]?.appointment_id || 9,
                amount: 1200.00,
                payment_method: 'Gateway',
                transaction_id: 'pay_OLD456ERR',
                payment_status: 'Verified',
                payment_date: yesterday
            }
        ];

        for (const p of samplePayments) {
            // Check if appointment exists
            const [exists] = await db.query('SELECT appointment_id FROM appointments WHERE appointment_id = ?', [p.appointment_id]);
            if (exists.length > 0) {
                await db.query(
                    `INSERT INTO payments (patient_id, doctor_id, appointment_id, amount, payment_method, transaction_id, payment_status, payment_date) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE transaction_id = VALUES(transaction_id), payment_status = VALUES(payment_status)`,
                    [p.patient_id, p.doctor_id, p.appointment_id, p.amount, p.payment_method, p.transaction_id, p.payment_status, p.payment_date]
                );
                console.log(`Inserted/Updated payment for Appt ID: ${p.appointment_id}`);
            } else {
                console.warn(`Skipping Appt ID ${p.appointment_id} - not found in DB`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
