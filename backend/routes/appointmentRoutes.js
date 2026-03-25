const express = require('express');
const {
    getAppointmentDetail,
    updatePaymentStatus
} = require('../controllers/patientController');
const { updateAppointmentStatus } = require('../controllers/doctorController');
const {
    getAppointments,
    getDoctorAppointments,
    getPatientAppointments,
    bookAppointment,
    getBookedSlots,
    rescheduleAppointment
} = require('../controllers/appointmentController');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');
const router = express.Router();

router.use(verifyToken);

// GET /api/appointments -> Unified role-based fetching
router.get('/', getAppointments);

// Admin: Get appointments by doctor/patient ID
router.get('/doctor/:doctorId', verifyRole('admin'), getDoctorAppointments);
router.get('/patient/:patientId', verifyRole('admin'), getPatientAppointments);

// GET /api/appointments/booked-slots/:doctorId -> Get booked slots for a doctor
router.get('/booked-slots/:doctorId', getBookedSlots);

// POST /api/appointments/book -> Book an appointment (Patient)
router.post('/book', bookAppointment);

// GET /api/appointments/:id -> Get details for payment
router.get('/:id', getAppointmentDetail);

// POST /api/appointments/:id/pay -> Update payment status
router.post('/:id/pay', updatePaymentStatus);

// PUT /api/appointments/:id/status -> Update status (Doctor)
router.put('/:id/status', updateAppointmentStatus);

// PUT /api/appointments/:id/reschedule -> Reschedule appointment (Patient)
router.put('/:id/reschedule', rescheduleAppointment);

module.exports = router;
