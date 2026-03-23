const db = require('./config/db');

async function check() {
    try {
        const [docs] = await db.query('SELECT COUNT(*) as total FROM doctors');
        const [patients] = await db.query('SELECT COUNT(*) as total FROM patients');
        const [appts] = await db.query('SELECT COUNT(*) as total FROM appointments');
        const [payments] = await db.query('SELECT COUNT(*) as total FROM payments');

        console.log(`Doctors: ${docs[0].total}`);
        console.log(`Patients: ${patients[0].total}`);
        console.log(`Appointments: ${appts[0].total}`);
        console.log(`Payments: ${payments[0].total}`);

        const [recentAppts] = await db.query('SELECT appointment_id, patient_id, doctor_id, amount FROM appointments ORDER BY created_at DESC LIMIT 10');
        console.log('\n--- Recent Appointments ---');
        console.log(JSON.stringify(recentAppts, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
