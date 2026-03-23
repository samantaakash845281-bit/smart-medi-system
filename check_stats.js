const db = require('./backend/config/db');

async function check() {
    try {
        console.log("Listing All Users...");
        const [u] = await db.query('SELECT id, fullName, role FROM users');
        console.log('Users:', u);

        console.log("Listing All Patients...");
        const [p] = await db.query('SELECT patient_id, fullName, email FROM patients');
        console.log('Patients:', p);

        console.log("Listing All Doctors...");
        const [d] = await db.query('SELECT doctor_id, fullName FROM doctors');
        console.log('Doctors:', d);

        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err);
        process.exit(1);
    }
}

check();
