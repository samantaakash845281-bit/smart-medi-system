const mysql = require('mysql2/promise');

async function testPasswords() {
    const passwords = ['', 'root', 'admin', 'password', '1234', '12345678'];
    for (const pw of passwords) {
        console.log(`Testing password: "${pw}"`);
        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: pw,
                connectTimeout: 2000
            });
            console.log(`✅ Success with password: "${pw}"`);
            await connection.end();
            process.exit(0);
        } catch (err) {
            console.error(`❌ Failed with password "${pw}":`, err.message);
        }
    }
}

testPasswords();
