const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Migrating appointments table...');

        // Add columns if they don't exist
        const columnsToAdd = [
            { name: 'patient_name', type: 'VARCHAR(255)' },
            { name: 'doctor_name', type: 'VARCHAR(255)' },
            { name: 'department', type: 'VARCHAR(255)' },
            { name: 'payment_method', type: 'VARCHAR(100)' },
            { name: 'booking_status', type: "ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rejected') DEFAULT 'Pending'" }
        ];

        for (const col of columnsToAdd) {
            try {
                await pool.query(`ALTER TABLE appointments ADD COLUMN ${col.name} ${col.type}`);
                console.log(`Added column: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    throw err;
                }
            }
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
