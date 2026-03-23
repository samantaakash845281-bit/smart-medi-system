const express = require('express');
const router = express.Router();
const { 
    createOrder, verifyPayment, getAllPayments, updatePaymentStatus, 
    confirmPayment, getPatientPayments, autoPay, submitManualPayment,
    getDoctorPayments, getReceipt
} = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');
const { proofUpload } = require('../middleware/uploadMiddleware');

// All payment routes are protected
router.use(verifyToken);

// Admin only routes
router.get('/all', verifyRole('admin'), getAllPayments);
router.put('/update-status/:id', verifyRole('admin'), updatePaymentStatus);

// Patient routes
router.get('/patient', verifyRole('patient'), getPatientPayments);
router.post('/auto-pay', verifyRole('patient'), autoPay);
router.post('/confirm', verifyRole('patient'), confirmPayment);
router.post('/submit-manual', verifyRole('patient'), proofUpload.single('proof'), submitManualPayment);

// Doctor routes
router.get('/doctor', verifyRole('doctor'), getDoctorPayments);

// Shared/Specific routes
router.get('/receipt/:id', getReceipt);

// Razorpay routes
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

module.exports = router;
