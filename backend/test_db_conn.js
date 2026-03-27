const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function testConnection() {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);

    const commonPublicHosts = [
        'junction.proxy.rlwy.net',
        'roundhouse.proxy.rlwy.net',
        'monorail.proxy.rlwy.net'
    ];

    const currentHost = process.env.DB_HOST;
    let hostsToTry = [currentHost];
    if (currentHost.endsWith('.internal')) {
        hostsToTry = hostsToTry.concat(commonPublicHosts);
    }

    for (const host of hostsToTry) {
        console.log(`\nAttempting connection to host: ${host}...`);
        try {
            const connection = await mysql.createConnection({
                host: host,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                connectTimeout: 5000
            });
            console.log(`✅ Success! Connected to ${host}`);
            await connection.end();
            return;
        } catch (err) {
            console.error(`❌ Failed to connect to ${host}:`, err.message);
        }
    }
}

testConnection();
