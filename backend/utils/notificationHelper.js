const db = require('../config/db');

/**
 * Create a notification and emit it via Socket.IO
 * @param {Object} io - Socket.IO instance from req.app.get('socketio')
 * @param {Object} data - Notification data { userId, title, message, type }
 */
const createNotification = async (io, { userId, title, message, type = 'info' }) => {
    try {
        // 1. Save to Database
        const [result] = await db.query(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [userId, title, message, type]
        );

        const notificationId = result.insertId;

        // 2. Emit Real-time Event
        if (io) {
            // Determine the room name based on user role would be ideal, 
            // but for now, we'll try both common patterns or broadcast to user-specific room.
            // In SMMS, rooms are: doctor_{id}, patient_{id}, admin
            
            const payload = {
                id: notificationId,
                title,
                message,
                type,
                is_read: 0,
                created_at: new Date()
            };

            // Emit to specific user rooms (most common paths)
            io.to(`patient_${userId}`).emit('newNotification', payload);
            io.to(`doctor_${userId}`).emit('newNotification', payload);
            
            // If admin, we can also emit to admin room if userId matches an admin's id
            // For now, these targeted emits cover 99% of cases.
        }

        return notificationId;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = {
    createNotification
};
