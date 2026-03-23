const db = require('./backend/config/db');

async function migrate() {
    try {
        console.log("Checking for 'reason' column in appointments table...");
        const [columns] = await db.query("SHOW COLUMNS FROM appointments LIKE 'reason'");
        
        if (columns.length === 0) {
            console.log("Adding 'reason' column...");
            await db.query("ALTER TABLE appointments ADD COLUMN reason VARCHAR(255) DEFAULT 'Regular Checkup'");
            console.log("Column 'reason' added successfully.");
        } else {
            console.log("Column 'reason' already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
