const db = require('../config/db');

// @route   GET /api/notifications
// @desc    Get user notifications
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
            [userId]
        );

        const [[unreadCount]] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({
            success: true,
            data: rows,
            unreadCount: unreadCount.count
        });
    } catch (error) {
        next(error);
    }
};

// @route   PUT /api/notifications/read/:id
// @desc    Mark notification as read
const markAsRead = async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
