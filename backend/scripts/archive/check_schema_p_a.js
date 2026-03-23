const pool = require('./config/db');

async function check() {
    try {
        const [patients] = await pool.query("DESCRIBE patients");
        console.log("PATIENTS SCHEMA:");
        patients.forEach(f => console.log(`${f.Field}: ${f.Type} (Key: ${f.Key})`));
        
        const [appointments] = await pool.query("DESCRIBE appointments");
        console.log("\nAPPOINTMENTS SCHEMA:");
        appointments.forEach(f => console.log(`${f.Field}: ${f.Type} (Key: ${f.Key})`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
