const pool = require('./config/db');

async function fixSchema() {
    try {
        console.log('Ensuring appointments table has all required columns...');

        const columns = [
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS department VARCHAR(255)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100)",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0.00",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_status ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rejected') DEFAULT 'Pending'"
        ];

        for (const sql of columns) {
            try {
                // MySQL 8.0.19+ supports ADD COLUMN IF NOT EXISTS, but older versions don't.
                // We'll use a try-catch for each.
                await pool.query(sql.replace('IF NOT EXISTS', ''));
                console.log(`Executed: ${sql}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column already exists: ${sql.split(' ').pop()}`);
                } else {
                    console.error(`Error executing ${sql}:`, err.message);
                }
            }
        }

        const paymentColumns = [
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url VARCHAR(500) DEFAULT NULL",
            "ALTER TABLE payments MODIFY COLUMN payment_method ENUM('Gateway', 'UPI', 'Bank Transfer', 'Simulated') DEFAULT 'Gateway'",
            "ALTER TABLE payments MODIFY COLUMN payment_status ENUM('pending', 'verified', 'paid', 'failed', 'expired', 'cancelled', 'rejected') DEFAULT 'pending'",
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS expiry_time TIMESTAMP NULL DEFAULT NULL"
        ];

        for (const sql of paymentColumns) {
            try {
                await pool.query(sql.replace('IF NOT EXISTS', ''));
                console.log(`Executed: ${sql}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME' || err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column adjustment already present: ${sql}`);
                } else {
                    console.error(`Error executing ${sql}:`, err.message);
                }
            }
        }
        const userTables = ['patients', 'doctors', 'admins'];
        for (const table of userTables) {
            const sql = `ALTER TABLE ${table} ADD COLUMN profile_image VARCHAR(500) DEFAULT NULL`;
            try {
                await pool.query(sql);
                console.log(`Executed: ${sql}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column profile_image already exists in ${table}`);
                } else {
                    console.error(`Error adding profile_image to ${table}:`, err.message);
                }
            }
        }

        console.log('Schema fix complete!');
        process.exit(0);
    } catch (err) {
        console.error('Schema fix failed:', err);
        process.exit(1);
    }
}

fixSchema();
