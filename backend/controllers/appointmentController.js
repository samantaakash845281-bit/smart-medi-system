const db = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');
const { generateReceipt } = require('../utils/receiptGenerator');
const { sendBookingConfirmation } = require('../utils/emailService');
const path = require('path');

// @route   GET /api/appointments
// @desc    Unified appointment fetching for all roles
const getAppointments = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = '';
        let queryParams = [userId];

        if (role === 'doctor') {
            query = `
                SELECT 
                    a.appointment_id as id,
                    p.fullName as patientName,
                    p.email as patientEmail,
                    a.appointment_date,
                    a.time_slot as appointment_time,
                    a.status,
                    a.amount,
                    'Follow-up' as type,
                    a.reason
                FROM appointments a
                JOIN patients p ON a.patient_id = p.patient_id
                WHERE a.doctor_id = ?
                ORDER BY a.appointment_date DESC, a.time_slot DESC
            `;
        } else if (role === 'patient' || role === 'user') {
            query = `
                SELECT 
                    a.appointment_id as id,
                    d.fullName as doctorName,
                    d.specialization as department,
                    a.appointment_date,
                    a.time_slot as appointment_time,
                    a.status,
                    a.amount,
                    'Physical' as type
                FROM appointments a
                JOIN doctors d ON a.doctor_id = d.doctor_id
                WHERE a.patient_id = ?
                ORDER BY a.appointment_date DESC, a.time_slot DESC
            `;
        } else if (role === 'admin') {
            query = `
                SELECT 
                    a.appointment_id as id,
                    p.fullName as patientName,
                    d.fullName as doctorName,
                    d.specialization as department,
                    a.appointment_date,
                    a.time_slot as appointment_time,
                    a.status,
                    a.amount
                FROM appointments a
                JOIN patients p ON a.patient_id = p.patient_id
                JOIN doctors d ON a.doctor_id = d.doctor_id
                ORDER BY a.appointment_date DESC, a.time_slot DESC
            `;
            queryParams = []; // Admin fetches all
        } else {
            return res.status(403).json({ success: false, message: 'Invalid role' });
        }

        const [appointments] = await db.query(query, queryParams);
        
        // Ensure we always return an array, even if empty
        res.json({ 
            success: true, 
            data: Array.isArray(appointments) ? appointments : [] 
        });

    } catch (error) {
        console.error("Unified Appointment Fetch Error:", error);
        res.status(500).json({ success: false, message: "Error fetching appointments", data: [] });
    }
};

// @route   GET /api/appointments/doctor/:doctorId
// @desc    Admin: Get appointments for a specific doctor
const getDoctorAppointments = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const [appointments] = await db.query(`
            SELECT a.appointment_id as id, p.fullName as patientName, a.appointment_date, a.time_slot as appointment_time, a.status, a.amount
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date DESC
        `, [doctorId]);
        res.json({ success: true, data: appointments });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/appointments/patient/:patientId
// @desc    Admin: Get appointments for a specific patient
const getPatientAppointments = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const [appointments] = await db.query(`
            SELECT a.appointment_id as id, d.fullName as doctorName, d.specialization as department, a.appointment_date, a.time_slot as appointment_time, a.status, a.amount
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        `, [patientId]);
        res.json({ success: true, data: appointments });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/appointments/book
// @desc    Book a new appointment (with receipt and real-time updates)
const bookAppointment = async (req, res, next) => {
    try {
        const { doctorId, date, timeSlot, amount, reason, paymentMethod } = req.body;
        
        // Resilient ID Resolution: req.user.id might be a user_id or patient_id
        let patientId = req.user.id;
        
        // 1. Try finding patient record directly by ID
        const [patById] = await db.query('SELECT patient_id FROM patients WHERE patient_id = ?', [patientId]);
        
        if (patById.length > 0) {
            patientId = patById[0].patient_id;
        } else {
            // 2. If not found, try to find by email from the users table
            const [userRecord] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
            if (userRecord.length > 0) {
                const [patByEmail] = await db.query('SELECT patient_id FROM patients WHERE email = ?', [userRecord[0].email]);
                if (patByEmail.length > 0) {
                    patientId = patByEmail[0].patient_id;
                }
            }
        }
        
        // Fallback for Demo/Google users if email lookup is needed but not found in users
        if (!patientId || patientId === 'google-demo-user') {
            // Check if there is ANY patient with a matching name or email from demo data
            // For now, if it's still google-demo-user, we use a default patient or fail
            const [firstPat] = await db.query('SELECT patient_id FROM patients LIMIT 1');
            if (firstPat.length > 0) patientId = firstPat[0].patient_id;
        }

        if (!doctorId || !date || !timeSlot || !amount) {
            return res.status(400).json({ success: false, message: 'Please provide doctor, date, and time slot' });
        }

        // 1. Fetch Details
        const [patientDetails] = await db.query('SELECT fullName, email, phone FROM patients WHERE patient_id = ?', [patientId]);
        const [doctorDetails] = await db.query('SELECT fullName, specialization FROM doctors WHERE doctor_id = ?', [doctorId]);

        if (patientDetails.length === 0 || doctorDetails.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient or Doctor not found' });
        }

        const patient = patientDetails[0];
        const doctor = doctorDetails[0];

        // 2. Check Availability
        const [existing] = await db.query(
            'SELECT appointment_id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != "cancelled"',
            [doctorId, date, timeSlot]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'This slot is already booked' });
        }

        // 3. Create Appointment in 'pending' status
        const [result] = await db.query(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time_slot, amount, status, booking_status, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [patientId, doctorId, date, timeSlot, amount, 'pending', 'Pending', reason || 'Regular Checkup']
        );

        const appointmentId = result.insertId;

        const appointmentData = {
            id: appointmentId,
            doctorName: doctor.fullName,
            patientName: patient.fullName,
            date,
            time: timeSlot,
            amount,
            status: 'Pending'
        };

        // 4. Notifications & Socket Events (Limited to booked event)
        if (global.io) {
            global.io.emit('appointmentBooked', appointmentData);
            global.io.emit('newAppointment', appointmentData);
        }

        res.status(200).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment: appointmentData
        });

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ success: false, message: "Booking failed" });
    }
};

// @route   GET /api/appointments/booked-slots/:doctorId
// @desc    Get all booked slots for a doctor on a specific date (query param)
const getBookedSlots = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

        const [appointments] = await db.query(
            'SELECT time_slot FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != "cancelled"',
            [doctorId, date]
        );
        
        const bookedSlots = appointments.map(a => a.time_slot);
        res.json({ success: true, data: bookedSlots });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    bookAppointment,
    getBookedSlots
};
