const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

async function updateAuthSchema() {
    console.log('Starting Auth Schema Update...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smartmedi_db'
    });

    // 1. Update doctors table
    const [docCols] = await connection.query('DESCRIBE doctors');
    const docColNames = docCols.map(c => c.Field);

    if (!docColNames.includes('email')) {
        await connection.query('ALTER TABLE doctors ADD COLUMN email VARCHAR(100) UNIQUE AFTER name');
        console.log('Added email column to doctors');
    }
    if (!docColNames.includes('password')) {
        await connection.query('ALTER TABLE doctors ADD COLUMN password VARCHAR(255) AFTER email');
        console.log('Added password column to doctors');
    }

    // Default hash for 'password123'
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // Sync doctor emails from users table
    const [usersDocs] = await connection.query('SELECT fullName, email, password FROM users WHERE role="doctor"');
    for (const ud of usersDocs) {
        // Find doctor by name and update
        try {
            await connection.query('UPDATE doctors SET email = ?, password = ? WHERE name = ? AND (email IS NULL OR email = "")', [ud.email, ud.password, ud.fullName]);
        } catch (e) {
            console.log("Could not sync email for", ud.fullName, e.message);
        }
    }

    // For doctors without email from users, set a default
    const [doctors] = await connection.query('SELECT id, name FROM doctors WHERE email IS NULL OR email = ""');
    for (const doc of doctors) {
        const email = `${doc.name.replace(/[^a-zA-Z]/g, '').toLowerCase()}@smartmedi.com`;
        try {
            await connection.query('UPDATE doctors SET email = ?, password = ? WHERE id = ?', [email, defaultPasswordHash, doc.id]);
        } catch (e) {
            console.log("Could not set default email for", doc.name, e.message);
        }
    }

    // 2. Create admins table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    `);
    console.log('Created admins table');

    // 3. Migrate admins from users table
    const [usersAdmins] = await connection.query('SELECT fullName, email, password FROM users WHERE role="admin"');
    for (const ua of usersAdmins) {
        // Check if exists
        const [existingAdmin] = await connection.query('SELECT id FROM admins WHERE email = ?', [ua.email]);
        if (existingAdmin.length === 0) {
            await connection.query('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)', [ua.fullName, ua.email, ua.password]);
            console.log(`Migrated admin ${ua.email}`);
        }
    }

    // fallback if no admin in users
    if (usersAdmins.length === 0) {
        const [existingAdmin] = await connection.query('SELECT id FROM admins');
        if (existingAdmin.length === 0) {
            await connection.query('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)', ['System Admin', 'admin@smartmedi.com', defaultPasswordHash]);
            console.log('Created default admin: admin@smartmedi.com');
        }
    }

    await connection.end();
    console.log('Auth Schema Update Complete.');
}
updateAuthSchema().catch(console.error);
