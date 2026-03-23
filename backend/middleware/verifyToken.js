const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');

    // Check if no header
    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Usually sent as "Bearer [token]"
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Bypass for Frontend Google Login Demo functionality
        if (token === 'demo-google-token') {
            req.user = { id: 'google-demo-user', role: 'patient' };
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = { verifyToken };
