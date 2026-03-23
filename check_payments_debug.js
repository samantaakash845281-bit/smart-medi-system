const db = require('./backend/config/db');
async function checkPayments() {
    try {
        const [rows] = await db.query('SELECT * FROM payments');
        console.log('PAYMENTS_START');
        console.log(JSON.stringify(rows, null, 2));
        console.log('PAYMENTS_END');
        
        const [revenue] = await db.query('SELECT SUM(amount) as total FROM payments WHERE payment_status = "verified"');
        console.log('REVENUE_VERIFIED:', revenue[0].total);
        
        const [revenueUpper] = await db.query('SELECT SUM(amount) as total FROM payments WHERE payment_status = "VERIFIED"');
        console.log('REVENUE_VERIFIED_UPPER:', revenueUpper[0].total);
        
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkPayments();
