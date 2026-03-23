const mysql = require('mysql2/promise');
require('dotenv').config();

const updateSchemaResult = async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    try {
        console.log('Adding missing columns to patients table...');
        
        // Add authType
        try {
            await connection.query('ALTER TABLE patients ADD COLUMN authType VARCHAR(20) DEFAULT "email"');
            console.log('Added authType column');
        } catch (e) { console.log('authType might already exist'); }

        // Add isVerified
        try {
            await connection.query('ALTER TABLE patients ADD COLUMN isVerified BOOLEAN DEFAULT false');
            console.log('Added isVerified column');
        } catch (e) { console.log('isVerified might already exist'); }

        // Add age
        try {
            await connection.query('ALTER TABLE patients ADD COLUMN age INT DEFAULT NULL');
            console.log('Added age column');
        } catch (e) { console.log('age might already exist'); }

        // Ensure gender exists (it should, but just in case)
        try {
            await connection.query('ALTER TABLE patients ADD COLUMN gender VARCHAR(20) DEFAULT NULL');
            console.log('Added gender column');
        } catch (e) { console.log('gender might already exist'); }

        console.log('Database schema updated successfully');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await connection.end();
    }
};

updateSchemaResult();
