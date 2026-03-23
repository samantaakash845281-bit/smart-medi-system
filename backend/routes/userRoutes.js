const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, upload } = require('../controllers/userController');
const { verifyToken } = require('../middleware/verifyToken');

// @route   GET /api/users/profile/:id
// @desc    Get user profile (Admin or Resource Owner)
router.get('/profile/:id', verifyToken, getProfile);

// @route   PUT /api/users/update-profile/:id
// @desc    Update user profile & image upload
router.put('/update-profile/:id', verifyToken, upload.single('profile_image'), updateProfile);

module.exports = router;
