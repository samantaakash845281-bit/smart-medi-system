const pool = require('./config/db');
const fs = require('fs');

async function check() {
    try {
        const [patients] = await pool.query("DESCRIBE patients");
        const [appointments] = await pool.query("DESCRIBE appointments");
        const [doctors] = await pool.query("DESCRIBE doctors");
        
        const output = {
            patients,
            appointments,
            doctors
        };
        
        fs.writeFileSync('schema_dump.json', JSON.stringify(output, null, 2));
        console.log("Schema dumped to schema_dump.json");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
