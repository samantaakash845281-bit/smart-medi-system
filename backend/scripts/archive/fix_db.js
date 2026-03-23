const db = require('./config/db');

async function fixTable() {
    console.log("Connecting and creating table...");
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_identifier VARCHAR(100) NOT NULL,
                otp VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                INDEX idx_password_resets_identifier (user_identifier)
            ) ENGINE=InnoDB;
        `);
        console.log("Table password_resets successfully created.");
    } catch (err) {
        console.error("Failed to create table:", err);
    }
    process.exit();
}

fixTable();
