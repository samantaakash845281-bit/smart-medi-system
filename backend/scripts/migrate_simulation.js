const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log('Migrating database for Simulated Payment System...');

        // 1. Update appointments table status ENUM
        console.log('Updating appointments table status and payment_status...');
        // First check if columns exist and update ENUMs
        // Note: MySQL doesn't easily allow partial ENUM updates without ALTER TABLE
        await connection.query(`
            ALTER TABLE appointments 
            MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'completed', 'Confirmed', 'Cancelled') DEFAULT 'pending'
        `);

        // Check if payment_status exists in appointments (it should, based on previous edits)
        // If it doesn't exist, add it.
        try {
            await connection.query(`
                ALTER TABLE appointments 
                ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'unpaid') DEFAULT 'unpaid'
            `);
        } catch (e) {
            // Probably exists, just update it
            await connection.query(`
                ALTER TABLE appointments 
                MODIFY COLUMN payment_status ENUM('pending', 'paid', 'failed', 'unpaid') DEFAULT 'unpaid'
            `);
        }

        // 2. Update payments table
        console.log('Updating payments table...');
        try {
            await connection.query(`
                ALTER TABLE payments 
                ADD COLUMN expiry_time TIMESTAMP NULL
            `);
        } catch (e) {
            console.log('expiry_time column already exists or error adding it.');
        }

        // Remove razorpay_order_id if it exists (not strictly necessary but cleaner)
        try {
            await connection.query(`ALTER TABLE payments DROP COLUMN razorpay_order_id`);
        } catch (e) {
            // Might not exist
        }

        console.log('✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
