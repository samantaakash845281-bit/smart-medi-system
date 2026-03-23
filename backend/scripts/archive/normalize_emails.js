const pool = require('./config/db');

async function normalize() {
    try {
        console.log("Normalizing doctor emails...");
        
        const [doctors] = await pool.query("SELECT doctor_id, fullName, email FROM doctors");
        
        for (const doctor of doctors) {
            if (doctor.email.includes('@smartmedi.com')) {
                const namePart = doctor.fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
                const randomId = Math.floor(1000 + Math.random() * 9000);
                const newEmail = `${namePart}${randomId}@smms.com`;
                
                await pool.query("UPDATE doctors SET email = ? WHERE doctor_id = ?", [newEmail, doctor.doctor_id]);
                console.log(`Updated ${doctor.fullName}: ${doctor.email} -> ${newEmail}`);
            }
        }

        console.log("Normalization completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Normalization failed:", error);
        process.exit(1);
    }
}

normalize();
