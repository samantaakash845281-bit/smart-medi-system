const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const migrateRazorpayColumn = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log('Connected to MySQL. Adding razorpay_order_id to payments table...');

        const query = "ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255) DEFAULT NULL AFTER transaction_id";

        // Note: IF NOT EXISTS in ALTER TABLE works in MariaDB 10.0.2+ or MySQL 8.0.1+
        // For older MySQL, we handle via try-catch
        try {
            await connection.query(query);
            console.log('Successfully added razorpay_order_id column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column razorpay_order_id already exists.');
            } else {
                throw err;
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateRazorpayColumn();
