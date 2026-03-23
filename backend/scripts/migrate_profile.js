const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const updateSchema = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smartmedi_db'
        });

        console.log('Connected to MySQL. Updating users table schema...');

        // Columns to add if they do not exist
        const columnsToAdd = [
            "ADD COLUMN profile_image VARCHAR(500) DEFAULT NULL",
            "ADD COLUMN address TEXT DEFAULT NULL",
            "ADD COLUMN gender VARCHAR(20) DEFAULT NULL",
            "ADD COLUMN dob DATE DEFAULT NULL",
            "ADD COLUMN about TEXT DEFAULT NULL",
            "ADD COLUMN specialization VARCHAR(255) DEFAULT NULL"
        ];

        for (const col of columnsToAdd) {
            try {
                // Ignore duplicate column errors by executing them individually
                await connection.query(`ALTER TABLE users ${col};`);
                console.log(`Successfully executed: ALTER TABLE users ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping: ${col}`);
                } else {
                    console.error(`Error adding column: ${err.message}`);
                }
            }
        }

        console.log('Profile Schema update completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updateSchema();
