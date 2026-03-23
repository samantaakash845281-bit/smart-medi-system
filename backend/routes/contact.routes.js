const express = require('express');
const contactController = require('../controllers/contactController');

const router = express.Router();

// Public route for submitting contact messages
router.post('/contact', contactController.sendMessage);

module.exports = router;
