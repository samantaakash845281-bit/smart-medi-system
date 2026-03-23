const db = require('./config/db');

async function seedRealData() {
    try {
        console.log('Seeding more "real" data...');

        // 1. Get some recent appointments that don't have payments yet
        const [appts] = await db.query(`
            SELECT a.appointment_id, a.patient_id, a.doctor_id, a.amount 
            FROM appointments a
            LEFT JOIN payments p ON a.appointment_id = p.appointment_id
            WHERE p.payment_id IS NULL
            ORDER BY a.created_at DESC
            LIMIT 15
        `);

        if (appts.length === 0) {
            console.log('No eligible appointments found for seeding.');
            process.exit(0);
        }

        const methods = ['UPI', 'Card', 'Net Banking', 'Gateway'];
        const statuses = ['Paid', 'Verified', 'pending', 'failed'];

        for (let i = 0; i < appts.length; i++) {
            const apt = appts[i];
            const method = methods[i % methods.length];
            const status = statuses[i % statuses.length];
            const txnId = status === 'pending' ? null : `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const date = new Date();
            date.setDate(date.getDate() - (i % 5)); // Spread across last 5 days

            await db.query(`
                INSERT INTO payments 
                (patient_id, doctor_id, appointment_id, amount, payment_method, transaction_id, payment_status, payment_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [apt.patient_id, apt.doctor_id, apt.appointment_id, apt.amount || 500, method, txnId, status, date]);

            console.log(`Added ${status} payment for Appt ID: ${apt.appointment_id}`);
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedRealData();
