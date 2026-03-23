const db = require('./config/db');

async function inspect() {
    try {
        console.log("Dumping 'appointments' Columns:");
        const [cols] = await db.query('SHOW COLUMNS FROM appointments');
        cols.forEach(c => console.log(`${c.Field}: ${c.Type}`));
        process.exit(0);
    } catch (err) {
        console.error("Inspection failed:", err);
        process.exit(1);
    }
}

inspect();
