const pool = require('./config/db');

async function check() {
    try {
        const [rows] = await pool.query("SELECT doctor_id, fullName, email FROM doctors WHERE fullName LIKE '%Sanya%'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
