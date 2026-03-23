const express = require('express');
const { processMessage } = require('../controllers/chatbotController');

const router = express.Router();

// No token verification required for public contact page chatbot
router.post('/', processMessage);

module.exports = router;
