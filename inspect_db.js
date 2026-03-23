const db = require('./backend/config/db');

async function inspect() {
    try {
        console.log("Inspecting 'doctors' table...");
        const [docsCols] = await db.query('SHOW COLUMNS FROM doctors');
        console.log('Doctors columns:', docsCols.map(c => c.Field));

        console.log("\nInspecting 'patients' table...");
        const [patsCols] = await db.query('SHOW COLUMNS FROM patients');
        console.log('Patients columns:', patsCols.map(c => c.Field));
        
        process.exit(0);
    } catch (err) {
        console.error("Inspection failed:", err);
        process.exit(1);
    }
}

inspect();
