const db = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');
const { generateReceipt } = require('../utils/receiptGenerator');
const { sendBookingConfirmation } = require('../utils/emailService');
const path = require('path');

// @route   GET /api/patient/doctors
// @desc    Get all active doctors for booking
const getDoctors = async (req, res, next) => {
    try {
        const query = `
            SELECT doctor_id as id, fullName, specialization, available_days, available_time_slots
            FROM doctors 
            ORDER BY fullName ASC
        `;
        const [doctors] = await db.query(query);

        // Dynamic availability calculation
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];

        const mappedDoctors = doctors.map(d => {
            const availableDays = d.available_days ? d.available_days.split(',').map(day => day.trim()) : [];
            return {
                ...d,
                availability: availableDays.includes(todayName) ? 'Available' : 'Not Available',
                experience: '5+ Years',
                fee: 500,
                consultation_fee: 500
            };
        });
        res.json({ success: true, data: mappedDoctors });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ success: false, message: "Error fetching doctors" });
    }
};

// @route   GET /api/patient/departments
// @desc    Get all unique doctor specializations
const getDepartments = async (req, res, next) => {
    try {
        const query = `SELECT DISTINCT specialization as name FROM doctors`;
        const [depts] = await db.query(query);
        res.json({ success: true, data: depts.map(d => d.name) });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/patient/dashboard-stats
// @desc    Get stats for patient dashboard
const getPatientStats = async (req, res, next) => {
    try {
        // Resilient ID Resolution
        let patientId = req.user.id;
        const [pat] = await db.query('SELECT patient_id FROM patients WHERE patient_id = ?', [patientId]);
        if (pat.length > 0) patientId = pat[0].patient_id;

        const [upcoming] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ? AND appointment_date >= CURDATE() AND status != "cancelled"',
            [patientId]
        );

        const [prescriptions] = await db.query(
            'SELECT COUNT(*) as total FROM prescriptions WHERE patient_id = ?',
            [patientId]
        );

        const [reports] = await db.query(
            'SELECT COUNT(*) as total FROM reports WHERE patient_id = ?',
            [patientId]
        );

        const [past] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ? AND appointment_date < CURDATE()',
            [patientId]
        );

        res.json({
            success: true,
            data: {
                upcomingAppointments: upcoming[0]?.total || 0,
                activePrescriptions: prescriptions[0]?.total || 0,
                labReports: reports[0]?.total || 0,
                pastVisits: past[0]?.total || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// Note: bookAppointment and getAppointments have been moved to appointmentController.js for consolidation.

// @route   GET /api/patient/prescriptions
// @desc    Get all prescriptions for the patient
const getPrescriptions = async (req, res, next) => {
    try {
        const query = `
            SELECT p.id, p.medicine_name, p.dosage, p.instructions, p.created_at,
                   d.fullName as doctorName, a.appointment_date
            FROM prescriptions p
            JOIN doctors d ON p.doctor_id = d.doctor_id
            JOIN appointments a ON p.appointment_id = a.appointment_id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC
        `;
        const [prescriptions] = await db.query(query, [req.user.id]);
        res.json({ success: true, data: prescriptions });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/patient/reports
// @desc    Get all medical reports for the patient
const getReports = async (req, res, next) => {
    try {
        const query = `
            SELECT r.id, r.report_type, r.report_file, r.created_at,
                   d.fullName as doctorName
            FROM reports r
            JOIN doctors d ON r.doctor_id = d.doctor_id
            WHERE r.patient_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reports] = await db.query(query, [req.user.id]);
        res.json({ success: true, data: reports });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/patient/profile
// @desc    Get patient profile info
const getProfile = async (req, res, next) => {
    try {
        const [users] = await db.query(
            'SELECT patient_id as id, fullName, email FROM patients WHERE patient_id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Patient profile not found' });
        }

        res.json({ success: true, data: users[0] });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { fullName } = req.body;

        if (!fullName) {
            return res.status(400).json({ success: false, message: 'Please provide name' });
        }

        await db.query(
            'UPDATE patients SET fullName = ? WHERE patient_id = ?',
            [fullName, req.user.id]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};
// @route   GET /api/patient/doctors/:id/booked-slots
// @desc    Get booked time slots for a specific doctor on a specific date
const getBookedSlots = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const query = `
            SELECT time_slot 
            FROM appointments 
            WHERE doctor_id = ? AND appointment_date = ? 
            AND status NOT IN ('rejected', 'cancelled')
        `;

        const [bookings] = await db.query(query, [id, date]);
        const bookedSlots = bookings.map(b => b.time_slot);

        res.json({ success: true, data: bookedSlots });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/patient/medical-history
// @desc    Get unified medical history (appointments, prescriptions + reports)
const getMedicalHistory = async (req, res, next) => {
    try {
        // Resilient ID Resolution
        let patientId = req.params.patientId || req.user.id;
        const [patUser] = await db.query('SELECT patient_id FROM patients WHERE patient_id = ?', [patientId]);
        if (patUser.length > 0) patientId = patUser[0].patient_id;

        // User requested query: SELECT a.*, d.name AS doctorName, p.name AS patientName FROM appointments a JOIN doctors d ON a.doctor_id = d.id JOIN patients p ON a.patient_id = p.id WHERE a.patient_id = ? AND a.status = 'COMPLETED';
        // Note: Our schema uses fullName instead of name, and doctor_id/patient_id instead of id.
        const [rows] = await db.query(`
            SELECT a.*, d.fullName AS doctorName, p.fullName AS patientName
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            JOIN patients p ON a.patient_id = p.patient_id
            WHERE a.patient_id = ?
            AND a.status = 'completed'
            ORDER BY a.appointment_date DESC
        `, [patientId]);

        // If the user wants raw JSON as per their prompt: res.json(rows);
        // But to maintain project consistency (with potential success wrapper), I'll check if they use .data or raw object.
        // Their prompt shows: .then(data => setHistory(data))
        // This implies they expect the array directly if res.json(rows) is used.
        res.json(rows); 
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/appointments/:id
// @desc    Get appointment details for payment page
const getAppointmentDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.appointment_id as id, a.appointment_date, a.time_slot as appointment_time, a.status, 
                   d.fullName as doctorName, d.specialization as department
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            WHERE a.appointment_id = ? AND a.patient_id = ?
        `;
        const [rows] = await db.query(query, [id, req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/appointments/:id/pay
// @desc    Update appointment status after payment
const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'paid' or 'failed'

        let finalStatus = 'pending';
        let paymentStatus = 'unpaid';

        if (status === 'paid') {
            finalStatus = 'confirmed';
            paymentStatus = 'paid';
        } else if (status === 'failed' || status === 'expired') {
            finalStatus = 'cancelled';
            paymentStatus = status;
        }

        const [result] = await db.query(
            "UPDATE appointments SET status = ?, booking_status = ? WHERE appointment_id = ? AND patient_id = ?",
            [finalStatus, finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1), id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found or update failed' });
        }

        // Real-time Event (Socket.IO)
        if (status === 'paid') {
            const io = req.app.get('socketio');
            if (io) {
                // Fetch appointment details for socket payload
                const [apptDetails] = await db.query(`
                    SELECT a.appointment_id, a.patient_id, a.doctor_id, a.appointment_date, a.time_slot, a.amount,
                           p.fullName as patientName, d.fullName as doctorName, d.specialization as department
                    FROM appointments a
                    JOIN patients p ON a.patient_id = p.patient_id
                    JOIN doctors d ON a.doctor_id = d.doctor_id
                    WHERE a.appointment_id = ?
                `, [id]);

                if (apptDetails.length > 0) {
                    const appt = apptDetails[0];
                    const socketData = {
                        appointmentId: id,
                        patientName: appt.patientName,
                        doctorId: appt.doctor_id,
                        doctorName: appt.doctorName,
                        department: appt.department,
                        appointmentDate: appt.appointment_date,
                        appointmentTime: appt.time_slot,
                        status: 'Confirmed',
                        paymentStatus: 'paid'
                    };

                    io.to(`doctor_${appt.doctor_id}`).emit('appointmentBooked', socketData);
                    io.to('admin').emit('appointmentBooked', socketData);
                    
                    const paymentPayload = {
                        appointment_id: id,
                        patient_id: appt.patient_id,
                        doctor_id: appt.doctor_id,
                        amount: appt.amount,
                        status: 'paid'
                    };
                    io.to('admin').emit('paymentCompleted', paymentPayload);
                    io.to(`doctor_${appt.doctor_id}`).emit('paymentCompleted', paymentPayload);
                    io.emit('newAppointment', socketData);
                }
            }
        }

        res.json({ success: true, message: `Payment ${status === 'paid' ? 'successful' : 'failed'}. Status updated.` });
    } catch (error) {
        next(error);
    }
};

// Note: bookAppointment, getAppointments, and updatePaymentStatus have been moved to appointmentController.js for consolidation.

// Cleaned up the exports
module.exports = {
    getDoctors,
    getDepartments,
    getPatientStats,
    getPrescriptions,
    getReports,
    getProfile,
    updateProfile,
    getBookedSlots,
    getMedicalHistory,
    getAppointmentDetail,
    updatePaymentStatus
};