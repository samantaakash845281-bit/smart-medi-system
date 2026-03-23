const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkPayments() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_medi'
    });

    try {
        const [rows] = await connection.execute('SELECT payment_id, transaction_id, receipt_url FROM payments LIMIT 10');
        console.log('Recent Payments:');
        console.log(JSON.stringify(rows, null, 2));

        const fs = require('fs');
        const uploadsDir = path.join(__dirname, 'uploads/receipts');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log('\nFiles in uploads/receipts:');
            console.log(files);
        } else {
            console.log('\nuploads/receipts directory NOT FOUND');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkPayments();
