const db = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');

// @route   GET /api/doctor/dashboard-stats
// @desc    Get stats for doctor dashboard
const getDoctorStats = async (req, res, next) => {
    try {
        // Resilient ID Resolution: req.user.id might be doctor_id or user_id
        let doctorId = req.user.id;
        
        // Safety Check: Verify the doctor exists
        const [doc] = await db.query('SELECT doctor_id FROM doctors WHERE doctor_id = ?', [doctorId]);
        if (doc.length > 0) {
            doctorId = doc[0].doctor_id;
        }

        const [patients] = await db.query(
            'SELECT COUNT(DISTINCT patient_id) as total FROM appointments WHERE doctor_id = ?',
            [doctorId]
        );

        const [todayAppointments] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()',
            [doctorId]
        );

        const [upcomingAppointments] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ? AND appointment_date >= CURDATE() AND status IN ("pending", "confirmed")',
            [doctorId]
        );

        const [prescriptions] = await db.query(
            'SELECT COUNT(*) as total FROM prescriptions WHERE doctor_id = ?',
            [doctorId]
        );

        const [earnings] = await db.query(
            'SELECT SUM(amount) as total FROM payments WHERE doctor_id = ? AND LOWER(payment_status) IN ("paid", "verified")',
            [doctorId]
        );

        const [recentlyViewed] = await db.query(`
            SELECT DISTINCT p.patient_id as id, p.fullName as name 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.patient_id 
            WHERE a.doctor_id = ? 
            ORDER BY a.appointment_date DESC 
            LIMIT 3
        `, [doctorId]);

        res.json({
            success: true,
            data: {
                totalPatients: patients[0].total || 0,
                todayAppointments: todayAppointments[0].total || 0,
                upcomingAppointments: upcomingAppointments[0].total || 0,
                prescriptions: prescriptions[0].total || 0,
                totalEarnings: earnings[0].total || 0,
                recentlyViewedPatients: Array.isArray(recentlyViewed) ? recentlyViewed : []
            }
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/doctor/profile
// @desc    Get doctor profile info
const getProfile = async (req, res, next) => {
    try {
        const [doctor] = await db.query(
            'SELECT doctor_id as id, fullName, email, specialization as department, available_days, available_time_slots FROM doctors WHERE doctor_id = ?',
            [req.user.id]
        );

        if (doctor.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor profile not found' });
        }

        res.json({ success: true, data: doctor[0] });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/doctor/appointments
// @desc    Get appointments assigned to this doctor (Today or All)
const getAppointments = async (req, res, next) => {
    try {
        const { date } = req.query;
        let query = `
            SELECT
                a.appointment_id as id,
                p.patient_id,
                p.fullName as patientName,
                a.appointment_date,
                a.time_slot as appointment_time,
                a.status,
                'Follow-up' as type
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = ?
        `;

        const [doc] = await db.query('SELECT doctor_id FROM doctors WHERE doctor_id = ?', [req.user.id]);
        const doctorId = doc[0]?.doctor_id || req.user.id;

        const queryParams = [doctorId];

        if (date === 'today') {
            query += " AND DATE(a.appointment_date) = CURDATE() ";
        } else if (date) {
            query += " AND DATE(a.appointment_date) = ? ";
            queryParams.push(date);
        }

        query += " ORDER BY a.appointment_date DESC, a.time_slot DESC";

        const [appointments] = await db.query(query, queryParams);
        res.json({ success: true, data: appointments });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/doctor/appointment-status/:id
// @desc    Update appointment status (approve/reject/completed)
const updateAppointmentStatus = async (req, res, next) => {
    try {
        const appointmentId = req.params.id;
        const { status } = req.body;

        const [doc] = await db.query('SELECT doctor_id FROM doctors WHERE doctor_id = ?', [req.user.id]);
        const doctorId = doc[0]?.doctor_id || req.user.id;

        const [result] = await db.query(
            'UPDATE appointments SET status = ? WHERE appointment_id = ? AND doctor_id = ?',
            [status, appointmentId, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });
        }

        // Emit real-time event
        if (global.io) {
            const socketData = {
                appointmentId,
                status,
                doctorId
            };
            global.io.emit('appointmentStatusUpdated', socketData);
            
            if (status === 'cancelled') {
                global.io.emit('appointmentCancelled', socketData);
            }
        }

        res.json({ success: true, message: `Appointment marked as ${status} ` });
    } catch (error) {
        next(error);
    }
};


// Legacy createPrescription removed in favor of prescriptionController.js

// @route   GET /api/doctor/patients
// @desc    Get unique patients this doctor has seen
const getPatients = async (req, res, next) => {
    try {
        const [doc] = await db.query('SELECT doctor_id FROM doctors WHERE doctor_id = ?', [req.user.id]);
        const doctorId = req.params.doctorId || doc[0]?.doctor_id || req.user.id;
        
        // User requested query: SELECT DISTINCT p.* FROM patients p JOIN appointments a ON p.id = a.patient_id WHERE a.doctor_id = ?;
        // Note: Our schema uses patient_id instead of id.
        const query = `
            SELECT DISTINCT p.patient_id as id, p.fullName, p.email, p.phone, p.gender, p.dob, p.created_at
            FROM patients p
            JOIN appointments a ON p.patient_id = a.patient_id
            WHERE a.doctor_id = ?
            ORDER BY p.fullName ASC
        `;
        const [patients] = await db.query(query, [doctorId]);
        res.json(patients); // Return raw array as requested
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/doctor/upload-report
// @desc    Upload a medical report for a patient
const uploadReport = async (req, res, next) => {
    try {
        const { patient_id, report_type, report_file_url } = req.body;
        // In a real app we'd use Multer here to parse form-data and upload to S3.
        // For this backend, we are accepting the URL of the uploaded image/report.

        if (!patient_id || !report_type || !report_file_url) {
            return res.status(400).json({ success: false, message: 'Please provide patient_id, report_type, and report_file_url' });
        }

        const [result] = await db.query(
            'INSERT INTO reports (patient_id, doctor_id, report_type, report_file) VALUES (?, ?, ?, ?)',
            [patient_id, req.user.id, report_type, report_file_url]
        );

        res.status(201).json({ success: true, message: 'Report created successfully', data: { id: result.insertId } });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/doctors/department/:department
// @desc    Get doctors filtered by department (Case-insensitive)
const getDoctorsByDepartment = async (req, res, next) => {
    try {
        const { department } = req.params;
        
        // Fix: Case-insensitive matching in query or filter
        const query = `
            SELECT doctor_id as id, fullName, specialization as department, available_days, available_time_slots, created_at
            FROM doctors 
            WHERE LOWER(specialization) = LOWER(?)
            ORDER BY fullName ASC
        `;
        const [doctors] = await db.query(query, [department]);

        // Use real values from DB if available, fallback for missing columns
        const processedDoctors = doctors.map(doc => ({
            ...doc,
            availability: 'Available', // Maintain for demo logic
            experience: doc.experience ? `${doc.experience}+ Years` : '5+ Years',
            fee: doc.fees || 500
        }));

        res.json({ success: true, data: processedDoctors });
    } catch (error) {
        console.error("Error fetching doctors by department:", error);
        res.status(500).json({ success: false, message: "Error fetching doctors" });
    }
};

// @route   GET /api/doctors
// @desc    Get all active doctors from dedicated doctors table
const getAllDoctors = async (req, res, next) => {
    try {
        const query = `
            SELECT doctor_id as id, fullName, email, phone, gender, specialization as department, 
                   experience, fees as fee, available_days, available_time_slots, profile_image, created_at
            FROM doctors 
            ORDER BY fullName ASC
        `;
        const [doctors] = await db.query(query);

        // Dynamic availability calculation
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];

        const processedDoctors = doctors.map(doc => ({
            ...doc,
            availability: doc.available_days && doc.available_days.includes(todayName) ? 'Available' : 'Not Available',
            experience: doc.experience ? `${doc.experience}+ Years` : 'N/A',
            fee: doc.fee || 500
        }));

        res.json({ success: true, data: processedDoctors });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({ success: false, message: "Error fetching doctors" });
    }
};

// @route   PUT /api/doctor/appointments/:id/reschedule
// @desc    Reschedule an appointment
const rescheduleAppointment = async (req, res, next) => {
    try {
        const { date, timeSlot } = req.body;
        const appointmentId = req.params.id;

        if (!date || !timeSlot) {
            return res.status(400).json({ success: false, message: 'Please provide new date and time slot' });
        }

        const [result] = await db.query(
            'UPDATE appointments SET appointment_date = ?, time_slot = ?, status = "confirmed" WHERE appointment_id = ? AND doctor_id = ?',
            [date, timeSlot, appointmentId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });
        }

        // Notify patient
        if (global.io) {
            const socketData = { appointmentId, date, timeSlot, status: 'confirmed' };
            global.io.emit('appointmentUpdated', socketData);
            
            const [docInfo] = await db.query('SELECT fullName FROM doctors WHERE doctor_id = ?', [req.user.id]);
            const doctorName = docInfo[0]?.fullName || 'Doctor';
            
            // Get patient details for notification
            const [appt] = await db.query('SELECT patient_id FROM appointments WHERE appointment_id = ?', [appointmentId]);
            if (appt.length > 0) {
                await createNotification(global.io, {
                    userId: appt[0].patient_id,
                    title: 'Appointment Rescheduled',
                    message: `Your appointment with Dr. ${doctorName} has been rescheduled to ${date} at ${timeSlot}.`,
                    type: 'appointment'
                });
            }
        }

        res.json({ success: true, message: 'Appointment rescheduled successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/doctor/appointments/:id/start-consult
// @desc    Start consultation (Update status to in_progress)
const startConsultation = async (req, res, next) => {
    try {
        const appointmentId = req.params.id;

        // Verify it's confirmed first
        const [appt] = await db.query(
            'SELECT status, patient_id FROM appointments WHERE appointment_id = ? AND doctor_id = ?',
            [appointmentId, req.user.id]
        );

        if (appt.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appt[0].status !== 'confirmed' && appt[0].status !== 'in_progress') {
            return res.status(400).json({ success: false, message: 'Only confirmed appointments can be started' });
        }

        const [result] = await db.query(
            'UPDATE appointments SET status = "in_progress" WHERE appointment_id = ? AND doctor_id = ?',
            [appointmentId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Failed to start consultation' });
        }

        // Notify patient
        if (global.io) {
            const [docInfo] = await db.query('SELECT fullName FROM doctors WHERE doctor_id = ?', [req.user.id]);
            const doctorName = docInfo[0]?.fullName || 'Doctor';

            global.io.emit('appointmentStatusUpdated', { appointmentId, status: 'in_progress', doctorId: req.user.id });
            await createNotification(global.io, {
                userId: appt[0].patient_id,
                title: 'Consultation Started',
                message: `Dr. ${doctorName} has started your consultation.`,
                type: 'medical'
            });
        }

        res.json({ success: true, message: 'Consultation started successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/doctor/appointments/:id/complete-consult
// @desc    Complete a consultation
const completeConsultation = async (req, res, next) => {
    try {
        const appointmentId = req.params.id;

        const [result] = await db.query(
            'UPDATE appointments SET status = "completed" WHERE appointment_id = ? AND doctor_id = ?',
            [appointmentId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });
        }

        // Notify patient
        if (global.io) {
            const [docInfo] = await db.query('SELECT fullName FROM doctors WHERE doctor_id = ?', [req.user.id]);
            const doctorName = docInfo[0]?.fullName || 'Doctor';

            const [appt] = await db.query('SELECT patient_id FROM appointments WHERE appointment_id = ?', [appointmentId]);
            if (appt.length > 0) {
                global.io.emit('appointmentStatusUpdated', { appointmentId, status: 'completed', doctorId: req.user.id });
                await createNotification(global.io, {
                    userId: appt[0].patient_id,
                    title: 'Consultation Completed',
                    message: `Your consultation with Dr. ${doctorName} has been completed.`,
                    type: 'medical'
                });
            }
        }

        res.json({ success: true, message: 'Consultation completed successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/doctor/patients/:id/notes
// @desc    Add a note for a patient
const addPatientNote = async (req, res, next) => {
    try {
        const patientId = req.params.id;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ success: false, message: 'Note content is required' });
        }

        await db.query(
            'INSERT INTO patient_notes (patient_id, doctor_id, note) VALUES (?, ?, ?)',
            [patientId, req.user.id, note]
        );

        res.status(201).json({ success: true, message: 'Note added successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/doctor/patients/:id/history
// @desc    Get detailed patient medical history
const getPatientHistory = async (req, res, next) => {
    try {
        const patientId = req.params.id;

        // Get prescriptions
        const [prescriptions] = await db.query(
            'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );

        // Get reports
        const [reports] = await db.query(
            'SELECT * FROM reports WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );

        // Get notes
        const [notes] = await db.query(
            'SELECT n.*, d.fullName as doctorName FROM patient_notes n JOIN doctors d ON n.doctor_id = d.doctor_id WHERE n.patient_id = ? ORDER BY n.created_at DESC',
            [patientId]
        );

        res.json({
            success: true,
            data: {
                prescriptions,
                reports,
                notes
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctorStats,
    getProfile,
    getAppointments,
    updateAppointmentStatus,
    getPatients,
    uploadReport,
    getAllDoctors,
    getDoctorsByDepartment,
    rescheduleAppointment,
    startConsultation,
    completeConsultation,
    addPatientNote,
    getPatientHistory
};
