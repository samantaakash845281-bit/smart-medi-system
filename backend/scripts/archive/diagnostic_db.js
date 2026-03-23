const pool = require('./config/db');

async function diagnostic() {
    try {
        const [apptsCols] = await pool.query('SHOW COLUMNS FROM appointments');
        console.log('--- Appointments Table ---');
        apptsCols.forEach(col => console.log(`${col.Field}: ${col.Type}`));

        const [paymentCols] = await pool.query('SHOW COLUMNS FROM payments');
        console.log('\n--- Payments Table ---');
        paymentCols.forEach(col => console.log(`${col.Field}: ${col.Type}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnostic();
