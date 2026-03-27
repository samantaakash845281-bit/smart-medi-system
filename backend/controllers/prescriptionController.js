const pool = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/prescriptions');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const createPrescription = async (req, res, next) => {
    try {
        const { appointmentId, patientId, symptoms, diagnosis, medicines, tests, notes } = req.body;
        const doctorId = req.user.id; // From verifyToken middleware

        // 1. Validate appointment belongs to doctor
        const [appointment] = await pool.query(
            "SELECT * FROM appointments WHERE id = ? AND doctor_id = ?",
            [appointmentId, doctorId]
        );

        if (appointment.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or invalid appointment" });
        }

        // 2. Prevent Duplicate Prescription
        const [existing] = await pool.query(
            "SELECT id FROM prescriptions WHERE appointment_id = ?",
            [appointmentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "Prescription already exists for this appointment" });
        }

        // 3. Get Patient and Doctor Info for PDF
        const [[patient]] = await pool.query("SELECT fullName, email FROM patients WHERE id = ?", [patientId]);
        const [[doctor]] = await pool.query("SELECT fullName, specialization FROM doctors WHERE id = ?", [doctorId]);

        // 4. Generate PDF filename
        const filename = `Prescription_${appointmentId}_${Date.now()}.pdf`;
        const pdfPath = `uploads/prescriptions/${filename}`;
        const fullPath = path.join(__dirname, '..', pdfPath);

        // 5. Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(fullPath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('SMART MEDI SYSTEM', { align: 'center' });
        doc.fontSize(10).text('Professional Healthcare Management', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Doctor Info
        doc.fontSize(12).font('Helvetica-Bold').text(`Dr. ${doctor.fullName}`);
        doc.fontSize(10).font('Helvetica').text(`${doctor.specialization}`);
        doc.moveDown();

        // Patient Info
        doc.fontSize(11).font('Helvetica-Bold').text(`Patient Details:`);
        doc.fontSize(10).font('Helvetica').text(`Name: ${patient.fullName}`);
        doc.text(`ID: PT-${1000 + parseInt(patientId)}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Symptoms & Diagnosis
        doc.fontSize(11).font('Helvetica-Bold').text(`Symptoms:`);
        doc.fontSize(10).font('Helvetica').text(symptoms || 'N/A');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text(`Diagnosis:`);
        doc.fontSize(10).font('Helvetica').text(diagnosis || 'N/A');
        doc.moveDown();

        // Medicines
        doc.fontSize(12).font('Helvetica-Bold').text('RX / Medications:', { underline: true });
        doc.moveDown(0.5);
        if (medicines && Array.isArray(medicines)) {
            medicines.forEach((med, i) => {
                doc.fontSize(10).font('Helvetica').text(`${i + 1}. ${med.name} - ${med.dosage} (${med.frequency})`);
                if (med.instructions) {
                    doc.fontSize(9).font('Helvetica-Oblique').text(`   Inst: ${med.instructions}`).font('Helvetica');
                }
                doc.moveDown(0.2);
            });
        }
        doc.moveDown();

        // Tests
        if (tests) {
            doc.fontSize(11).font('Helvetica-Bold').text(`Recommended Tests:`);
            doc.fontSize(10).font('Helvetica').text(tests);
            doc.moveDown();
        }

        // Notes
        if (notes) {
            doc.fontSize(11).font('Helvetica-Bold').text(`Additional Notes:`);
            doc.fontSize(10).font('Helvetica').text(notes);
            doc.moveDown();
        }

        // Footer / Signature
        doc.moveDown(2);
        doc.fontSize(10).text('Digital Signature', { align: 'right' });
        doc.fontSize(11).font('Helvetica-Bold').text(`Dr. ${doctor.fullName}`, { align: 'right' });

        doc.end();

        // 6. Save to Database
        const [result] = await pool.query(
            "INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, symptoms, diagnosis, medicines, tests, notes, pdf_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [patientId, doctorId, appointmentId, symptoms, diagnosis, JSON.stringify(medicines), tests, notes, pdfPath]
        );

        const newPrescription = {
            id: result.insertId,
            appointmentId,
            patientId,
            doctorId,
            symptoms,
            diagnosis,
            medicines,
            tests,
            notes,
            pdfPath,
            createdAt: new Date()
        };

        // 7. Emit Socket Event & Create Notification
        const io = req.app.get('socketio');
        if (io) {
            io.emit('prescriptionAdded', newPrescription);
            
            // Create Notification for Patient
            await createNotification(io, {
                userId: patientId,
                title: 'New Prescription Added',
                message: `Dr. ${doctor.fullName} has added a new prescription for your consultation.`,
                type: 'medical'
            });
        }

        res.status(201).json({
            success: true,
            message: "Prescription saved and PDF generated",
            data: newPrescription
        });

    } catch (error) {
        console.error("Prescription Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPrescriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query, params;
        if (role === 'doctor') {
            query = `
                SELECT pr.*, p.fullName as patientName, a.appointment_date, a.time_slot as appointment_time
                FROM prescriptions pr
                JOIN patients p ON pr.patient_id = p.id
                JOIN appointments a ON pr.appointment_id = a.id
                WHERE pr.doctor_id = ?
                ORDER BY pr.created_at DESC
            `;
            params = [userId];
        } else if (role === 'admin') {
            query = `
                SELECT pr.*, p.fullName as patientName, d.fullName as doctorName, d.specialization, a.appointment_date, a.time_slot as appointment_time
                FROM prescriptions pr
                JOIN patients p ON pr.patient_id = p.id
                JOIN doctors d ON pr.doctor_id = d.id
                JOIN appointments a ON pr.appointment_id = a.id
                ORDER BY pr.created_at DESC
            `;
            params = [];
        } else {
            query = `
                SELECT pr.*, d.fullName as doctorName, d.specialization, a.appointment_date, a.time_slot as appointment_time
                FROM prescriptions pr
                JOIN doctors d ON pr.doctor_id = d.id
                JOIN appointments a ON pr.appointment_id = a.id
                WHERE pr.patient_id = ?
                ORDER BY pr.created_at DESC
            `;
            params = [userId];
        }

        const [prescriptions] = await pool.query(query, params);
        res.status(200).json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPrescription,
    getPrescriptions
};
