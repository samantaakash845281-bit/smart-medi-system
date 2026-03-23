const express = require('express');
const {
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
    getDoctorDetails,
    getPatientDetails,
    restorePatient
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.use(verifyToken);
router.use(verifyRole('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/reports', getReportsStats);
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorDetails);
router.post('/doctors', addDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.get('/patients', getPatients);
router.get('/patients/:id', getPatientDetails);
router.delete('/patients/:id', deletePatient);
router.put('/patients/:id/restore', restorePatient);
router.get('/appointments', getAllAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);
router.delete('/appointments/:id', deleteAppointment);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
