const db = require('./config/db');

async function checkTables() {
    try {
        const [rows] = await db.query('SHOW TABLES');
        console.log('Tables found:');
        rows.forEach(row => {
            console.log(Object.values(row)[0]);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTables();
