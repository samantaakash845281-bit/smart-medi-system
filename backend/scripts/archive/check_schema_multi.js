const pool = require('./config/db');

async function check() {
    try {
        const [patients] = await pool.query("DESCRIBE patients");
        console.log("PATIENTS:", JSON.stringify(patients, null, 2));
        const [appointments] = await pool.query("DESCRIBE appointments");
        console.log("APPOINTMENTS:", JSON.stringify(appointments, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
