const db = require('../config/db');

// @route   POST /api/contact
// @desc    Submit a contact message
exports.sendMessage = async (req, res, next) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const sql = "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";

        try {
            const [result] = await db.query(sql, [name, email, message]);
            res.status(200).json({
                success: true,
                message: "Message sent successfully"
            });
        } catch (dbErr) {
            console.log("Database Error:", dbErr);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }
    } catch (error) {
        next(error);
    }
};
