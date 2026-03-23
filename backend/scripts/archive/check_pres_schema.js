const db = require('./config/db');
const fs = require('fs');

async function checkPres() {
    try {
        const [pres] = await db.query('SHOW COLUMNS FROM prescriptions');
        fs.writeFileSync('pres_schema.json', JSON.stringify(pres, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPres();
