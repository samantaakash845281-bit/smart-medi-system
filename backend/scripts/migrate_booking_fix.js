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

        console.log('Migrating database for Appointment Booking Fix...');

        // 1. Update appointments table: Add fees column and update status ENUMs
        console.log('Adding fees column and updating status ENUMs...');

        // Add fees column if it doesn't exist
        try {
            await connection.query(`ALTER TABLE appointments ADD COLUMN fees DECIMAL(10,2) NOT NULL DEFAULT 0`);
            console.log('Added fees column.');
        } catch (e) {
            console.log('fees column already exists or error adding it.');
        }

        // Update status ENUM to include lowercase 'pending' if not present
        // MySQL ENUMs are case-insensitive by default in some collations, but let's be explicit.
        await connection.query(`
            ALTER TABLE appointments 
            MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'completed', 'Confirmed', 'Cancelled') DEFAULT 'pending'
        `);

        // Update payment_status ENUM to include 'pending' (lowercase)
        await connection.query(`
            ALTER TABLE appointments 
            MODIFY COLUMN payment_status ENUM('pending', 'paid', 'failed', 'unpaid') DEFAULT 'pending'
        `);

        console.log('✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
