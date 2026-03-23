const db = require('./backend/config/db');

async function check() {
    try {
        console.log("Searching All Doctors...");
        const [docs] = await db.query('SELECT doctor_id, fullName, specialization FROM doctors');
        console.log('All Doctors:', docs);

        console.log("\nSearching for 'Arvind' (Case-insensitive)...");
        const [arvind] = await db.query('SELECT * FROM doctors WHERE LOWER(fullName) LIKE "%arvind%"');
        console.log('Arvind Search Result:', arvind);

        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err);
        process.exit(1);
    }
}

check();
