const mysql = require('mysql2/promise');
const fs = require('fs');

async function inspect() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'smartmedi_db'
    });

    const schema = {};
    const [tables] = await connection.query('SHOW TABLES');
    for (const tableRow of tables) {
        const tableName = Object.values(tableRow)[0];
        const [columns] = await connection.query(`DESCRIBE ${tableName}`);
        const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
        schema[tableName] = {
            columns,
            create_statement: createTable[0]['Create Table']
        };
    }
    
    fs.writeFileSync('schema_detailed.json', JSON.stringify(schema, null, 2));
    console.log('Detailed schema saved to schema_detailed.json');
    await connection.end();
}

inspect().catch(console.error);
