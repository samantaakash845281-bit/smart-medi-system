const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');
const {
    exportAdminFinancial,
    exportDoctorSummary,
    exportPatientHistory
} = require('../controllers/reportController');

// Admin Routes
router.get('/admin/financial', verifyToken, verifyRole('admin'), exportAdminFinancial);

// Doctor Routes
router.get('/doctor/summary', verifyToken, verifyRole('doctor'), exportDoctorSummary);

// Patient Routes
router.get('/patient/history', verifyToken, verifyRole('patient'), exportPatientHistory);

module.exports = router;
