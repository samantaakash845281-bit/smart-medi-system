const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.get('/', getNotifications);
router.put('/read/:id', markAsRead);

module.exports = router;
