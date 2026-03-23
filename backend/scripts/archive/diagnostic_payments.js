const pool = require('./config/db');

async function diagnostic() {
    try {
        const [paymentCols] = await pool.query('SHOW COLUMNS FROM payments');
        console.log('\n--- Payments Table ---');
        paymentCols.forEach(col => console.log(`${col.Field}: ${col.Type}`));
        
        const [rows] = await pool.query('SELECT * FROM payments LIMIT 1');
        if (rows.length > 0) {
            console.log('\n--- Sample Row ---');
            console.log(Object.keys(rows[0]));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

diagnostic();
