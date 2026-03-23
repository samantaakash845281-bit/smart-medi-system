const db = require('./config/db');
async function fix() {
    try {
        console.log("Altering payments table...");
        await db.query(`ALTER TABLE payments MODIFY appointment_id INT NULL`);
        await db.query(`ALTER TABLE payments MODIFY transaction_id VARCHAR(255) NULL`);
        console.log("Schema updated successfully");
        process.exit(0);
    } catch (err) {
        console.error("Error updating schema:", err);
        process.exit(1);
    }
}
fix();
