const db = require('./config/db');

async function checkColumns() {
    try {
        const [patients] = await db.query('SHOW COLUMNS FROM patients');
        console.log('Patients Columns:', patients);
        const [appts] = await db.query('SHOW COLUMNS FROM appointments');
        console.log('Appointments Columns:', appts);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
