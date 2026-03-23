const express = require('express');
const router = express.Router();
const { 
    registerUser,
    loginUser,
    googleLogin,
    forgotPassword,
    verifyOtp,
    checkUser, 
    sendVerificationOtp, 
    verifyVerificationOtp, 
    registerUserFinal,
    getAllPatients
} = require('../controllers/authController');

// @route   POST /api/auth/register
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   POST /api/auth/google
router.post('/google', googleLogin);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtp);

// @route   POST /api/auth/check-user
router.post('/check-user', checkUser);

// @route   POST /api/auth/send-verification-otp
router.post('/send-verification-otp', sendVerificationOtp);

// @route   POST /api/auth/verify-verification-otp
router.post('/verify-verification-otp', verifyVerificationOtp);

// @route   POST /api/auth/register-user
router.post('/register-user', registerUserFinal);

// @route   GET /api/auth/patients
router.get('/patients', getAllPatients);

// @route   GET /api/auth/status (Port Discovery Ping)
router.get('/status', (req, res) => res.json({ success: true, message: 'Backend is online' }));

module.exports = router;
