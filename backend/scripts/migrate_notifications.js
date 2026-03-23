const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    try {
        console.log('Verifying notifications table...');
        
        // Ensure table exists with required fields
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if title column exists (it might be missing if older schema)
        const [columns] = await connection.query('SHOW COLUMNS FROM notifications');
        const hasTitle = columns.some(col => col.Field === 'title');
        
        if (!hasTitle) {
            console.log('Adding title column to notifications table...');
            await connection.query('ALTER TABLE notifications ADD COLUMN title VARCHAR(255) AFTER user_id');
        }

        console.log('Notifications table is ready.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
