const db = require('../config/db');
const bcrypt = require('bcrypt');
const { sendDoctorCredentials } = require('../utils/emailService');

// @route   GET /api/admin/dashboard-stats
// @desc    Get counts of doctors, patients, and appointments
const getDashboardStats = async (req, res, next) => {
    try {
        const [docs] = await db.query('SELECT COUNT(*) as total FROM doctors');
        const [patients] = await db.query('SELECT COUNT(*) as total FROM patients');
        const [appointments] = await db.query('SELECT COUNT(*) as total FROM appointments');
        const [todayAppts] = await db.query('SELECT COUNT(*) as total FROM appointments WHERE DATE(appointment_date) = CURDATE()');
        
        // Revenue should include both 'Paid' (gateway) and 'Verified' (manual)
        const [revenue] = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE LOWER(payment_status) IN ("verified", "paid")');
        
        // For today's revenue, use payment_date (required column for valid payments)
        const [todayRevenue] = await db.query(`
            SELECT COALESCE(SUM(amount), 0) as total FROM payments 
            WHERE LOWER(payment_status) IN ("verified", "paid") 
            AND DATE(payment_date) = CURDATE()
        `);

        // Registration Trend (Last 7 Months)
        const [registrationTrend] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%b') as month, 
                COUNT(*) as count 
            FROM patients 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY MONTH(created_at), DATE_FORMAT(created_at, '%b')
            ORDER BY MONTH(created_at)
        `);

        // Appointments by Department
        const [apptsByDept] = await db.query(`
            SELECT 
                d.specialization as department, 
                COUNT(*) as count 
            FROM appointments a 
            JOIN doctors d ON a.doctor_id = d.doctor_id 
            GROUP BY d.specialization
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                totalDoctors: docs[0].total,
                totalPatients: patients[0].total,
                totalAppointments: appointments[0].total,
                appointmentsToday: todayAppts[0].total,
                totalRevenue: revenue[0].total || 0,
                todayRevenue: todayRevenue[0].total || 0,
                registrationTrend,
                appointmentsByDepartment: apptsByDept
            }
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/doctors
// @desc    Get all doctors
const getDoctors = async (req, res, next) => {
    try {
        const [doctors] = await db.query(
            'SELECT doctor_id as id, fullName, email, specialization, available_days, available_time_slots FROM doctors ORDER BY fullName ASC'
        );
        res.json({ success: true, data: doctors });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/patients
// @desc    Get all patients
const getPatients = async (req, res, next) => {
    try {
        const [patients] = await db.query(
            'SELECT patient_id as id, fullName, email, phone, status, created_at FROM patients WHERE status != "deleted" ORDER BY fullName ASC'
        );
        res.json({ success: true, data: patients });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/admin/doctors/register
// @desc    Add new doctor with auto-generated credentials and documents
const registerDoctor = async (req, res, next) => {
    try {
        const { fullName, email: personalEmail, phone, gender, specialization, experience, fees, available_days, available_time_slots } = req.body;
        
        // 1. Generate Unique Portal Email
        // Format: name + 4 random digits + @smms.com
        const namePart = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const generatedEmail = `${namePart}${randomId}@smms.com`;

        // 2. Generate Random Secure Password (10 characters)
        const plainPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Files
        const files = req.files || {};
        const profileImage = files['profileImage'] ? `/uploads/doctors/${files['profileImage'][0].filename}` : null;
        const signature = files['signature'] ? `/uploads/doctors/${files['signature'][0].filename}` : null;
        const degreeCertificate = files['degreeCertificate'] ? `/uploads/doctors/${files['degreeCertificate'][0].filename}` : null;
        const certifications = files['certifications'] ? JSON.stringify(files['certifications'].map(f => `/uploads/doctors/${f.filename}`)) : '[]';

        const [result] = await db.query(
            `INSERT INTO doctors 
            (fullName, email, phone, gender, password, specialization, experience, fees, available_days, available_time_slots, profile_image, signature, degree_certificate, certifications, must_change_password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                fullName, generatedEmail, phone, gender, hashedPassword, specialization, 
                experience || 0, fees || 500.00, 
                available_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', 
                available_time_slots || '10:00 AM - 05:00 PM',
                profileImage, signature, degreeCertificate, certifications
            ]
        );

        // 3. Send Credentials via Email to personalEmail
        await sendDoctorCredentials(personalEmail, generatedEmail, plainPassword, fullName);

        const newDoctorData = {
            id: result.insertId,
            fullName,
            email: generatedEmail, // Return the portal email
            specialization,
            profile_image: profileImage
        };

        // Emit real-time event
        const io = req.app.get('socketio');
        if (io) {
            io.emit('doctorAdded', newDoctorData);
            console.log('Emitted doctorAdded event:', newDoctorData.fullName);
        }

        res.json({ success: true, message: 'Doctor registered successfully. Credentials sent to email.', portalEmail: generatedEmail });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/admin/doctors
// @desc    Add new doctor (LEGACY/SIMPLE)
const addDoctor = async (req, res, next) => {
    try {
        const { fullName, email, password, specialization, available_days, available_time_slots } = req.body;
        const hashedPassword = await bcrypt.hash(password || 'password123', 10);

        await db.query(
            'INSERT INTO doctors (fullName, email, password, specialization, available_days, available_time_slots) VALUES (?, ?, ?, ?, ?, ?)',
            [fullName, email, hashedPassword, specialization, available_days || 'Monday,Tuesday,Wednesday,Thursday,Friday', available_time_slots || '10:00 AM - 05:00 PM']
        );
        res.json({ success: true, message: 'Doctor added successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/doctors/:id
// @desc    Update doctor details
const updateDoctor = async (req, res, next) => {
    try {
        const { fullName, email, specialization, available_days, available_time_slots } = req.body;
        await db.query(
            'UPDATE doctors SET fullName = ?, email = ?, specialization = ?, available_days = ?, available_time_slots = ? WHERE doctor_id = ?',
            [fullName, email, specialization, available_days, available_time_slots, req.params.id]
        );
        res.json({ success: true, message: 'Doctor updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/admin/doctors/:id
// @desc    Delete doctor
const deleteDoctor = async (req, res, next) => {
    try {
        await db.query('DELETE FROM doctors WHERE doctor_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/admin/patients/:id
// @desc    Soft delete patient (for Undo support)
const deletePatient = async (req, res, next) => {
    try {
        await db.query('UPDATE patients SET status = "deleted" WHERE patient_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Patient moved to trash' });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/patients/:id/restore
// @desc    Restore a soft-deleted patient
const restorePatient = async (req, res, next) => {
    try {
        await db.query('UPDATE patients SET status = "active" WHERE patient_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Patient restored successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/appointments
// @desc    Get all appointments across the system
const getAllAppointments = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                a.appointment_id as id,
                p.fullName as patientName,
                p.patient_id as patient_id,
                d.fullName as doctorName,
                d.doctor_id as doctor_id,
                d.specialization as department,
                a.appointment_date,
                a.time_slot as appointment_time,
                a.status as status,
                COALESCE(py.payment_status, 'Unpaid') as payment_status,
                a.created_at
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN doctors d ON a.doctor_id = d.doctor_id
            LEFT JOIN payments py ON a.appointment_id = py.appointment_id
            ORDER BY a.appointment_date DESC, a.time_slot DESC
        `;
        const [appointments] = await db.query(query);
        res.json({ success: true, data: appointments });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/appointments/:id/status
// @desc    Update appointment status (Approve/Cancel)
const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        await db.query('UPDATE appointments SET status = ? WHERE appointment_id = ?', [status, appointmentId]);

        // If admin confirms, also mark payment as verified
        if (status === 'confirmed') {
            await db.query('UPDATE payments SET payment_status = "verified" WHERE appointment_id = ?', [appointmentId]);
        }

        // Notify patient and doctor
        const io = req.app.get('socketio');
        if (io) {
            const [appt] = await db.query('SELECT patient_id, doctor_id FROM appointments WHERE appointment_id = ?', [appointmentId]);
            if (appt.length > 0) {
                const { patient_id, doctor_id } = appt[0];
                const payload = { id: appointmentId, appointment_id: appointmentId, status };

                io.to(`patient_${patient_id}`).emit('appointmentConfirmed', payload);
                io.to(`doctor_${doctor_id}`).emit('appointmentConfirmed', payload);

                // If confirmed, it means payment is verified, so emit paymentCompleted to update revenue
                if (status === 'confirmed') {
                    const [payInfo] = await db.query('SELECT amount FROM payments WHERE appointment_id = ?', [appointmentId]);
                    const paymentPayload = {
                        appointment_id: appointmentId,
                        patient_id,
                        doctor_id,
                        amount: payInfo[0]?.amount || 0,
                        status: 'verified'
                    };
                    io.to('admin').emit('paymentCompleted', paymentPayload);
                    io.to(`doctor_${doctor_id}`).emit('paymentCompleted', paymentPayload);
                }
            }
        }

        res.json({ success: true, message: `Appointment ${status === 'confirmed' ? 'approved' : status} successfully` });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/admin/appointments/:id
// @desc    Delete appointment
const deleteAppointment = async (req, res, next) => {
    try {
        await db.query('DELETE FROM appointments WHERE appointment_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/reports-stats
// @desc    Get detailed stats for reports page
const getReportsStats = async (req, res, next) => {
    try {
        const [doctors] = await db.query('SELECT COUNT(*) as total FROM doctors');
        const [patients] = await db.query('SELECT COUNT(*) as total FROM patients');
        const [totalAppts] = await db.query('SELECT COUNT(*) as total FROM appointments');
        const [completedAppts] = await db.query('SELECT COUNT(*) as total FROM appointments WHERE status = "completed"');
        const [cancelledAppts] = await db.query('SELECT COUNT(*) as total FROM appointments WHERE status = "cancelled"');
        
        // Revenue should include both 'Paid' (gateway) and 'Verified' (manual)
        const [revenue] = await db.query('SELECT SUM(amount) as total FROM payments WHERE LOWER(payment_status) IN ("verified", "paid")');
        
        // For today's revenue, use payment_date
        const [todayRevenue] = await db.query(`
            SELECT SUM(amount) as total FROM payments 
            WHERE LOWER(payment_status) IN ("verified", "paid") 
            AND DATE(payment_date) = CURDATE()
        `);

        // Get count by status for the chart
        const [statusCounts] = await db.query('SELECT status, COUNT(*) as count FROM appointments GROUP BY status');
        
        // Get recent appointments
        const [recentAppts] = await db.query(`
            SELECT a.appointment_id, p.fullName as patientName, d.fullName as doctorName, a.status 
            FROM appointments a 
            JOIN patients p ON a.patient_id = p.patient_id 
            JOIN doctors d ON a.doctor_id = d.doctor_id 
            ORDER BY a.created_at DESC LIMIT 5
        `);

        const [dailyAppts] = await db.query('SELECT DATE(appointment_date) as date, COUNT(*) as count FROM appointments GROUP BY DATE(appointment_date) LIMIT 7');

        res.json({
            success: true,
            data: {
                totalDoctors: doctors[0].total,
                totalPatients: patients[0].total,
                totalAppointments: totalAppts[0].total,
                completedAppointments: completedAppts[0].total,
                cancelledAppointments: cancelledAppts[0].total,
                totalRevenue: revenue[0].total || 0,
                todayRevenue: todayRevenue[0].total || 0,
                appointmentsByStatus: statusCounts,
                recentAppointments: recentAppts,
                dailyTrends: dailyAppts
            }
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/settings
// @desc    Get admin profile
const getSettings = async (req, res, next) => {
    try {
        const [admin] = await db.query('SELECT admin_id as id, fullName, email FROM admins WHERE admin_id = ?', [req.user.id]);
        res.json({ success: true, data: admin[0] });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/admin/settings
// @desc    Update admin profile/password
const updateSettings = async (req, res, next) => {
    try {
        const { fullName, email, currentPassword, newPassword } = req.body;

        // 1. Verify current password
        const [admin] = await db.query('SELECT password FROM admins WHERE admin_id = ?', [req.user.id]);
        if (admin.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });

        const isMatch = await bcrypt.compare(currentPassword, admin[0].password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        // 2. Update logic
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE admins SET fullName = ?, email = ?, password = ? WHERE admin_id = ?', [fullName, email, hashedPassword, req.user.id]);
        } else {
            await db.query('UPDATE admins SET fullName = ?, email = ? WHERE admin_id = ?', [fullName, email, req.user.id]);
        }
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/doctors/:id
// @desc    Get detailed doctor info
const getDoctorDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [doctor] = await db.query('SELECT * FROM doctors WHERE doctor_id = ?', [id]);
        
        if (doctor.length === 0) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        const [apptStats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
            FROM appointments WHERE doctor_id = ?
        `, [id]);

        const [earnings] = await db.query(`
            SELECT SUM(amount) as total FROM payments 
            WHERE doctor_id = ? AND LOWER(payment_status) IN ('paid', 'verified')
        `, [id]);

        const [recentAppointments] = await db.query(`
            SELECT 
                a.appointment_id as id,
                p.fullName as patientName,
                a.appointment_date,
                a.time_slot as appointment_time,
                a.status
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date DESC, a.time_slot DESC
            LIMIT 10
        `, [id]);

        res.json({
            success: true,
            data: {
                ...doctor[0],
                totalAppointments: apptStats[0].total || 0,
                completedAppointments: apptStats[0].completed || 0,
                totalEarnings: earnings[0].total || 0,
                recentAppointments: Array.isArray(recentAppointments) ? recentAppointments : [],
                recentActivity: Array.isArray(recentAppointments) ? recentAppointments : [] // Double mapping for safety
            }
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/admin/patients/:id
// @desc    Get detailed patient info
const getPatientDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [patient] = await db.query('SELECT * FROM patients WHERE patient_id = ?', [id]);

        if (patient.length === 0) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        const [apptStats] = await db.query(`
            SELECT COUNT(*) as total FROM appointments WHERE patient_id = ?
        `, [id]);

        const [medicalHistory] = await db.query(`
            SELECT 
                a.appointment_id as id,
                d.fullName as doctorName,
                d.specialization,
                a.appointment_date,
                a.time_slot as appointment_time,
                a.status
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.doctor_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        `, [id]);

        const [prescriptions] = await db.query(`
            SELECT p.*, d.fullName as doctorName
            FROM prescriptions p
            JOIN doctors d ON p.doctor_id = d.doctor_id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC
        `, [id]);

        res.json({
            success: true,
            data: {
                ...patient[0],
                totalAppointments: apptStats[0].total || 0,
                medicalHistory,
                prescriptions
            }
        });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    getDashboardStats,
    getDoctors,
    getPatients,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    deletePatient,
    getAllAppointments,
    updateAppointmentStatus,
    deleteAppointment,
    getReportsStats,
    getSettings,
    updateSettings,
    registerDoctor,
    getDoctorDetails,
    getPatientDetails,
    restorePatient
};
