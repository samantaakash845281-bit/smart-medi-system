const mysql = require('mysql2/promise');

async function testPasswords() {
    const passwords = ['', 'root', 'admin', 'password', '1234', '12345678', 'mysql', 'sql', '123', 'root123', 'admin123'];
    for (const pw of passwords) {
        process.stdout.write(`Testing: "${pw}"... `);
        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pw,
                connectTimeout: 1500
            });
            console.log(`✅ SUCCESS!`);
            await connection.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ FAILED (${err.message})`);
        }
    }
}

testPasswords();
