const db = require('./backend/config/db');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        console.log("Seeding Demo Doctors...");
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash("SmartMedi@123", salt);

        const demoDoctors = [
            { id: 101, name: "Dr. Arvind Sharma", department: "Cardiology", fee: 800 },
            { id: 102, name: "Dr. Priya Varma", department: "Neurology", fee: 1200 },
            { id: 103, name: "Dr. Rajesh Koothrappali", department: "Orthopedics", fee: 750 },
            { id: 104, name: "Dr. Sheldon Cooper", department: "Pediatrics", fee: 1500 },
            { id: 105, name: "Dr. Bernadette Rostenkowski", department: "Dermatology", fee: 900 },
            { id: 106, name: "Dr. Leonard Hofstadter", department: "General Physician", fee: 500 },
            { id: 107, name: "Dr. Howard Wolowitz", department: "Gastroenterology", fee: 650 },
            { id: 108, name: "Dr. Amy Farrah Fowler", department: "Gynecology", fee: 1100 }
        ];

        for (const doc of demoDoctors) {
            // Check if doctor exists
            const [existing] = await db.query('SELECT doctor_id FROM doctors WHERE doctor_id = ? OR fullName = ?', [doc.id, doc.name]);
            
            if (existing.length === 0) {
                console.log(`Inserting ${doc.name}...`);
                await db.query(`
                    INSERT INTO doctors (doctor_id, fullName, email, password, role, specialization, fees, experience, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        doc.id, 
                        doc.name, 
                        `${doc.name.toLowerCase().replace(/\s/g, '').replace('dr.', '')}@smartmedi.com`, 
                        password, 
                        'doctor', 
                        doc.department, 
                        doc.fee,
                        '10+ Years',
                        'active'
                    ]
                );
            } else {
                console.log(`${doc.name} already exists. Updating fee if needed...`);
                await db.query('UPDATE doctors SET fees = ?, specialization = ? WHERE doctor_id = ?', [doc.fee, doc.department, doc.id]);
            }
        }

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
