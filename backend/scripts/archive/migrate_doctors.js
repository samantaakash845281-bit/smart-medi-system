const pool = require('./config/db');

async function migrate() {
    try {
        console.log("Starting migration...");
        
        const queries = [
            'ALTER TABLE doctors ADD COLUMN phone VARCHAR(20) AFTER email',
            'ALTER TABLE doctors ADD COLUMN gender ENUM("Male", "Female", "Other") DEFAULT "Male" AFTER phone',
            'ALTER TABLE doctors ADD COLUMN experience INT DEFAULT 0 AFTER specialization',
            'ALTER TABLE doctors ADD COLUMN fees DECIMAL(10, 2) DEFAULT 500.00 AFTER experience',
            'ALTER TABLE doctors ADD COLUMN signature VARCHAR(500) AFTER profile_image',
            'ALTER TABLE doctors ADD COLUMN degree_certificate VARCHAR(500) AFTER signature',
            'ALTER TABLE doctors ADD COLUMN certifications TEXT AFTER degree_certificate'
        ];

        for (const query of queries) {
            try {
                await pool.query(query);
                console.log(`Successfully executed: ${query}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column already exists, skipping: ${query.split('ADD COLUMN ')[1].split(' ')[0]}`);
                } else {
                    throw err;
                }
            }
        }

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
