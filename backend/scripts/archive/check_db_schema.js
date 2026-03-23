const db = require('./config/db');
const fs = require('fs');

async function checkColumns() {
    try {
        const [patients] = await db.query('SHOW COLUMNS FROM patients');
        const [appts] = await db.query('SHOW COLUMNS FROM appointments');
        const data = {
            patients,
            appointments: appts
        };
        fs.writeFileSync('db_schema.json', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
