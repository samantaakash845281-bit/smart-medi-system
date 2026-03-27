const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedCompletedAppointments() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'healthcare_system'
    });

    try {
        console.log('Fetching some appointments to mark as COMPLETED...');
        const [appts] = await db.query('SELECT id FROM appointments LIMIT 5');
        
        if (appts.length === 0) {
            console.log('No appointments found to update.');
            return;
        }

        const ids = appts.map(a => a.appointment_id);
        console.log(`Updating appointments ${ids.join(', ')} to status='completed'...`);
        
        await db.query('UPDATE appointments SET status = "completed" WHERE appointment_id IN (?)', [ids]);
        
        console.log('Successfully updated appointments to completed.');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await db.end();
    }
}

seedCompletedAppointments();
