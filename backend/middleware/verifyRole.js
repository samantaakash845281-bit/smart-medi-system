const verifyRole = (...roles) => {
    return (req, res, next) => {
        // If the route requires 'patient', but the token has 'user', allow it.
        const allowedRoles = [...roles];
        if (allowedRoles.includes('patient') && !allowedRoles.includes('user')) {
            allowedRoles.push('user');
        }

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You do not have the required permissions.'
            });
        }
        next();
    };
};

module.exports = { verifyRole };
