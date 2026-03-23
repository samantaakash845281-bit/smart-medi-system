const db = require('./config/db');
const fs = require('fs');

async function checkTables() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        const results = [];
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [columns] = await db.query(`DESCRIBE ${tableName}`);
            const [count] = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            results.push({
                table: tableName,
                columns: columns.map(c => c.Field),
                count: count[0].count
            });
        }
        fs.writeFileSync('temp_tables.json', JSON.stringify(results, null, 2));
        console.log('Results written to temp_tables.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTables();
