const pool = require('./config/db');

async function migrate() {
    try {
        console.log("Starting data correction migration...");
        
        // 1. Add created_at column if missing
        try {
            await pool.query("ALTER TABLE doctors ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER must_change_password");
            console.log("Added created_at column.");
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log("created_at column already exists.");
            } else {
                throw err;
            }
        }

        // 2. Fix Dr. Sanya Malhotra's email
        await pool.query("UPDATE doctors SET email = 'drsanyamalho4567@smms.com' WHERE email = '' OR email IS NULL");
        console.log("Fixed missing emails.");

        // 3. Normalize other emails to @smms.com if they are still @smartmedi.com (Optional but good for consistency)
        // Actually, let's only fix the blank ones as requested "correct the text and empty field"
        
        // 4. Ensure created_at is not null for older records (though default handles it, sometimes manual update is safer)
        await pool.query("UPDATE doctors SET created_at = '2026-01-15 10:00:00' WHERE created_at IS NULL OR created_at = '0000-00-00 00:00:00'");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
