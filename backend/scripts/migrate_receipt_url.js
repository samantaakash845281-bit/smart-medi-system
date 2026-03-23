const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log('Adding receipt_url to payments table...');
        
        // Check if column exists first
        const [columns] = await connection.query('SHOW COLUMNS FROM payments LIKE "receipt_url"');
        
        if (columns.length === 0) {
            await connection.query('ALTER TABLE payments ADD COLUMN receipt_url VARCHAR(255) DEFAULT NULL');
            console.log('✅ Column receipt_url added successfully.');
        } else {
            console.log('ℹ️ Column receipt_url already exists.');
        }

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
