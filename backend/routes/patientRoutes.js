const express = require('express');
const {
    getDoctors,
    getDepartments,
    getPatientStats,
    getReports,
    getProfile,
    updateProfile,
    getMedicalHistory
} = require('../controllers/patientController');
const { getPrescriptions } = require('../controllers/prescriptionController');
const { 
    bookAppointment, 
    getPatientAppointments: getAppointments, 
    getBookedSlots 
} = require('../controllers/appointmentController');
const { getPatientDetails } = require('../controllers/adminController');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

// Protect all patient routes with verifyToken
router.use(verifyToken);

router.use(verifyRole('patient'));

router.get('/doctors', getDoctors);
router.get('/departments', getDepartments);
router.get('/booked-slots/:doctorId', getBookedSlots); // Unified endpoint
router.get('/doctors/:id/booked-slots', getBookedSlots); // Keep for compatibility
router.get('/dashboard-stats', getPatientStats);
router.post('/book-appointment', bookAppointment);
router.get('/appointments', getAppointments);
router.get('/prescriptions', getPrescriptions);
router.get('/reports', getReports);
router.get('/profile', getProfile);
router.put('/update-profile', updateProfile);
router.get('/medical-history', getMedicalHistory);
router.get('/medical-history/patient/:patientId', getMedicalHistory); // Adding the requested route name as an alias/alternative

// Wildcard routes must come last
router.get('/:id', getPatientDetails);

module.exports = router;
