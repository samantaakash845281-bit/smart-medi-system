const express = require('express');
const {
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
} = require('../controllers/doctorController');
const { registerDoctor, getDoctorDetails } = require('../controllers/adminController');
const upload = require('../utils/doctorUpload');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

// Protect all doctor routes with verifyToken
router.use(verifyToken);

// This route should be accessible by patients too for booking
router.get('/', getAllDoctors);
router.get('/department/:department', getDoctorsByDepartment);

// Admin only: Register new doctor
router.post('/register', verifyToken, verifyRole('admin'), upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 },
    { name: 'certifications', maxCount: 10 }
]), registerDoctor);

// The following routes are only for doctors
router.use(verifyRole('doctor'));

router.get('/dashboard-stats', getDoctorStats);
router.get('/profile', getProfile);
router.get('/appointments', getAppointments);
router.put('/appointment-status/:id', updateAppointmentStatus);
router.get('/patients', getPatients);
router.get('/patients/doctor/:doctorId', getPatients); // Adding the requested route name as an alias/alternative
router.put('/appointments/:id/reschedule', rescheduleAppointment);
router.put('/appointments/:id/start-consult', startConsultation);
router.put('/appointments/:id/complete-consult', completeConsultation);
router.post('/patients/:id/notes', addPatientNote);
router.get('/patients/:id/history', getPatientHistory);
router.post('/upload-report', uploadReport);

// Wildcard routes must come last
router.get('/:id', getDoctorDetails);

module.exports = router;
