const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @route   POST /api/auth/register
// @desc    Register a user (Doctor or Patient)
const registerUser = async (req, res, next) => {
    try {
        const { fullName, email, phone, password, role } = req.body;

        // Validation
        if (!fullName || !email || !phone || !password || !role) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

       let cleanPhone = phone.replace(/\D/g, ''); // Remove non-digit characters
if (!/^\d{10}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
}
        // Check if email exists in any table
        const [patientEmail] = await db.query('SELECT patient_id FROM patients WHERE email = ?', [email]);
        const [doctorEmail] = await db.query('SELECT doctor_id FROM doctors WHERE email = ?', [email]);
        const [adminEmail] = await db.query('SELECT admin_id FROM admins WHERE email = ?', [email]);

        if (patientEmail.length > 0 || doctorEmail.length > 0 || adminEmail.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Check if phone exists
        const [existingPhone] = await db.query('SELECT patient_id FROM patients WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }

        // Determine initial status based on role
        let status = 'active';
        if (role === 'doctor') {
            return res.status(400).json({ success: false, message: 'Doctor registration is handled by Admin' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert patient
        const [result] = await db.query(
            'INSERT INTO patients (fullName, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
            [fullName, email, cleanPhone, hashedPassword, 'patient', status]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                id: result.insertId,
                fullName: fullName,
                email,
                role: 'patient'
            }
        });
    } catch (error) {
        console.error("Registration Error (registerUser):", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
        }
        next(error);
    }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Unified for All Roles)
const loginUser = async (req, res, next) => {
    try {
        const { email, password, role: requestedRole } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        let user = null;
        let role = null;
        let idField = '';
        let nameField = 'fullName';

        // Helper to find user in a specific table
        const findUserInTable = async (tableName, idCol) => {
            const isPhone = /^\d{10}$/.test(email.replace(/\D/g, ''));
            const cleanIdentifier = isPhone ? email.replace(/\D/g, '') : email;
            
            const query = isPhone 
                ? `SELECT * FROM ${tableName} WHERE phone = ?` 
                : `SELECT * FROM ${tableName} WHERE email = ?`;
                
            const [users] = await db.query(query, [cleanIdentifier]);
            if (users.length > 0) {
                return { userData: users[0], idCol };
            }
            return null;
        };

        // If a role is provided, try that table first
        if (requestedRole) {
            let table = 'patients';
            let id = 'patient_id';
            
            if (requestedRole === 'doctor') {
                table = 'doctors';
                id = 'doctor_id';
            } else if (requestedRole === 'admin') {
                table = 'admins';
                id = 'admin_id';
            } else if (requestedRole === 'patient' || requestedRole === 'user') {
                table = 'patients';
                id = 'patient_id';
            }

            const result = await findUserInTable(table, id);
            if (result) {
                user = result.userData;
                idField = result.idCol;
                role = user.role || requestedRole; // Use stored role if available
                if (role === 'user') role = 'patient';
            }
        }

        // If user not found (or no role provided), search all tables sequentially
        if (!user) {
            // Try Admins
            let result = await findUserInTable('admins', 'admin_id');
            if (result) {
                user = result.userData;
                idField = result.idCol;
                role = 'admin';
            } else {
                // Try Doctors
                result = await findUserInTable('doctors', 'doctor_id');
                if (result) {
                    user = result.userData;
                    idField = result.idCol;
                    role = 'doctor';
                } else {
                    // Try Patients
                    result = await findUserInTable('patients', 'patient_id');
                    if (result) {
                        user = result.userData;
                        idField = result.idCol;
                        role = 'patient';
                    }
                }
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 1. Check Account Status (Active/Blocked)
        if (user.status && user.status !== 'active') {
            return res.status(403).json({ success: false, message: 'Your account is currently inactive or blocked. Please contact support.' });
        }

        // 2. Check Verification Status (Patients Only)
        if (role === 'patient' && user.isVerified === 0) {
            return res.status(403).json({ success: false, message: 'Please verify your phone number before logging in.' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ success: false, message: 'Server configuration error: JWT_SECRET missing' });
        }

        const userId = user[idField];

        // Sign Token
        jwt.sign(
            { id: userId, role: role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
            (err, token) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Authentication failed' });
                }

                res.json({
                    success: true,
                    message: 'Login successful',
                    token: token,
                    role: role,
                    user: {
                        id: userId,
                        fullName: user[nameField],
                        name: user[nameField],
                        email: user.email,
                        role: role
                    }
                });
            }
        );
    } catch (error) {
        next(error);
    }
};

const { sendOTP, sendVerificationOTP } = require('../utils/emailService');

// @route   POST /api/auth/forgot-password
// @desc    Generate OTP and send it
const forgotPassword = async (req, res, next) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Please provide your email or phone number' });
        }

        // Check if user exists by email or phone across all tables
        let user = null;
        let table = '';
        
        // Try Patients
        const [patients] = await db.query('SELECT patient_id as id, email, phone, fullName FROM patients WHERE email = ? OR phone = ?', [identifier, identifier]);
        if (patients.length > 0) {
            user = patients[0];
            table = 'patients';
        } else {
            // Try Doctors
            const [doctors] = await db.query('SELECT doctor_id as id, email, phone, fullName FROM doctors WHERE email = ? OR phone = ?', [identifier, identifier]);
            if (doctors.length > 0) {
                user = doctors[0];
                table = 'doctors';
            } else {
                // Try Admins
                const [admins] = await db.query('SELECT admin_id as id, email, phone, fullName FROM admins WHERE email = ? OR phone = ?', [identifier, identifier]);
                if (admins.length > 0) {
                    user = admins[0];
                    table = 'admins';
                }
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'No registered account found with that email or phone number' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before storing (Security Best Practice)
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Set expiration time (10 minutes from now)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Manage previously generated OTPs (invalidate old ones)
        await db.query('DELETE FROM password_resets WHERE user_identifier = ?', [identifier]);

        // Insert new OTP record
        await db.query(
            'INSERT INTO password_resets (user_identifier, otp, expires_at) VALUES (?, ?, ?)',
            [identifier, hashedOtp, expiresAt]
        );

        // Send OTP via our Mock Service
        await sendOTP(identifier, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully to your registered contact method'
        });

    } catch (error) {
        next(error);
    }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and reset password
const verifyOtp = async (req, res, next) => {
    try {
        const { identifier, otp, newPassword } = req.body;

        if (!identifier || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Fetch the OTP record for this user
        const [resets] = await db.query('SELECT * FROM password_resets WHERE user_identifier = ?', [identifier]);

        if (resets.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        const resetRecord = resets[resets.length - 1]; // get the latest if multiples managed to slip by

        // Check expiration
        if (new Date() > new Date(resetRecord.expires_at)) {
            await db.query('DELETE FROM password_resets WHERE id = ?', [resetRecord.id]);
            return res.status(400).json({ success: false, message: 'OTP expired. Request a new OTP.' });
        }

        // Verify the OTP Hash
        const isMatch = await bcrypt.compare(otp, resetRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please enter the correct OTP.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update User's password in the detected table
        const [pTable] = await db.query('SELECT "patients" as tbl FROM patients WHERE email = ? OR phone = ? UNION SELECT "doctors" as tbl FROM doctors WHERE email = ? OR phone = ? UNION SELECT "admins" as tbl FROM admins WHERE email = ? OR phone = ?', [identifier, identifier, identifier, identifier, identifier, identifier]);
        
        if (pTable.length === 0) {
            return res.status(404).json({ success: false, message: 'User account lost during session. Please retry.' });
        }

        const targetTable = pTable[0].tbl;
        const idCol = targetTable === 'patients' ? 'patient_id' : (targetTable === 'doctors' ? 'doctor_id' : 'admin_id');

        await db.query(`UPDATE ${targetTable} SET password = ? WHERE email = ? OR phone = ?`, [hashedPassword, identifier, identifier]);

        // Clean up the used OTP record
        await db.query('DELETE FROM password_resets WHERE user_identifier = ?', [identifier]);

        res.json({
            success: true,
            message: 'Password successfully reset. You can now login.'
        });

    } catch (error) {
        console.error("OTP Error:", error);
        res.status(400).json({ success: false, message: error.message || "OTP verification failed" });
    }
};

// @route   POST /api/auth/google
// @desc    Authenticate user via Google (Register if new, Login if exists)
const googleLogin = async (req, res, next) => {
    try {
        const { email, fullName, googleId } = req.body;

        if (!email || !fullName) {
            return res.status(400).json({ success: false, message: 'Missing Google user data' });
        }

        // Check if user exists in any table to determine role, but default to patients
        let user = null;
        let role = null;
        let idField = '';
        let nameField = 'fullName';

        const [patients] = await db.query('SELECT * FROM patients WHERE email = ?', [email]);
        if (patients.length > 0) {
            user = patients[0];
            role = 'patient';
            idField = 'patient_id';
        } else {
            const [doctors] = await db.query('SELECT * FROM doctors WHERE email = ?', [email]);
            if (doctors.length > 0) {
                user = doctors[0];
                role = 'doctor';
                idField = 'doctor_id';
            } else {
                const [admins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
                if (admins.length > 0) {
                    user = admins[0];
                    role = 'admin';
                    idField = 'admin_id';
                }
            }
        }

        if (!user) {
            // Auto-register new user as a patient
            const placeholderPassword = await bcrypt.hash(googleId || Math.random().toString(36), 10);
            const [result] = await db.query(
                'INSERT INTO patients (fullName, email, password, role, status, authType, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [fullName, email, placeholderPassword, 'patient', 'active', 'google', true]
            );
            
            const newUserId = result.insertId;
            const newRole = 'patient';

            // Sign Token for newly created user
            return jwt.sign(
                { id: newUserId, role: newRole },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '30d' },
                (err, token) => {
                    if (err) return next(err);
                    res.json({
                        success: true,
                        message: 'Google registration and login successful',
                        token: token,
                        role: newRole,
                        user: {
                            id: newUserId,
                            fullName: fullName,
                            name: fullName,
                            email: email,
                            role: newRole
                        }
                    });
                }
            );
        }

        const userId = user[idField];
        const finalRole = user.role || role;

        // Sign Token for existing user
        jwt.sign(
            { id: userId, role: finalRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
            (err, token) => {
                if (err) return next(err);
                
                res.json({
                    success: true,
                    message: 'Google authentication successful',
                    token: token,
                    role: finalRole,
                    user: {
                        id: userId,
                        fullName: user[nameField] || user.name,
                        name: user[nameField] || user.name,
                        email: user.email,
                        role: finalRole
                    }
                });
            }
        );

    } catch (error) {
        next(error);
    }
};

// @route   POST /api/auth/check-user
// @desc    Check if a user exists given their email address
const checkUser = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });

        const [patients] = await db.query('SELECT * FROM patients WHERE email = ?', [email]);
        if (patients.length > 0) return res.json({ exists: true, role: 'patient' });

        const [doctors] = await db.query('SELECT * FROM doctors WHERE email = ?', [email]);
        if (doctors.length > 0) return res.json({ exists: true, role: 'doctor' });

        const [admins] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
        if (admins.length > 0) return res.json({ exists: true, role: 'admin' });

        res.json({ exists: false });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/auth/send-verification-otp
const sendVerificationOtp = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });

        // Check if email exists in any table
        const [patient] = await db.query('SELECT patient_id FROM patients WHERE email = ?', [email]);
        const [doctor] = await db.query('SELECT doctor_id FROM doctors WHERE email = ?', [email]);
        const [admin] = await db.query('SELECT admin_id FROM admins WHERE email = ?', [email]);

        if (patient.length > 0 || doctor.length > 0 || admin.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Check if phone exists (if provided during initial step)
        if (phone) {
            const [existingPhone] = await db.query('SELECT patient_id FROM patients WHERE phone = ?', [phone]);
            if (existingPhone.length > 0) {
                return res.status(400).json({ success: false, message: 'Phone number already registered' });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await db.query('DELETE FROM password_resets WHERE user_identifier = ?', [email]);
        await db.query(
            'INSERT INTO password_resets (user_identifier, otp, expires_at) VALUES (?, ?, ?)',
            [email, hashedOtp, expiresAt]
        );

        await sendVerificationOTP(email, otp);

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/auth/verify-verification-otp
const verifyVerificationOtp = async (req, res, next) => {
    try {
        const { email, otp, fullName, googleId } = req.body;
        if (!email || !otp || !fullName) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const [resets] = await db.query('SELECT * FROM password_resets WHERE user_identifier = ?', [email]);
        if (resets.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }
        
        const resetRecord = resets[resets.length - 1];
        if (new Date() > new Date(resetRecord.expires_at)) {
            await db.query('DELETE FROM password_resets WHERE id = ?', [resetRecord.id]);
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        const isMatch = await bcrypt.compare(otp, resetRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Just verify, don't register yet. User will fills details next.
        res.json({
            success: true,
            message: 'OTP verified successfully. Please complete your profile.'
        });
    } catch (err) {
        next(err);
    }
};

// @route   POST /api/auth/register-user
// @desc    Final registration for both Google and Email users after OTP
const registerUserFinal = async (req, res, next) => {
    try {
        const { email, fullName, phone, age, gender, googleId, password } = req.body;
        
        if (!email || !fullName || !phone || !age || !gender) {
            return res.status(400).json({ success: false, message: 'Please provide all details' });
        }

        // Validate phone number (exactly 10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }

        // Check if phone already registered
        const [existingPhone] = await db.query('SELECT patient_id FROM patients WHERE phone = ?', [phone]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone number already used by another account' });
        }

        // Finalize registration
        const salt = await bcrypt.genSalt(10);
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, salt);
        } else {
            hashedPassword = await bcrypt.hash(googleId || Math.random().toString(36), salt);
        }

        const authType = googleId ? 'google' : 'email';

        const [result] = await db.query(
            'INSERT INTO patients (fullName, email, phone, age, gender, password, role, status, authType, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [fullName, email, phone, age, gender, hashedPassword, 'patient', 'active', authType, true]
        );

        const userId = result.insertId;
        const role = 'patient';

        // Emit real-time event to Admin
        const io = req.app.get('socketio');
        if (io) {
            io.to('admin').emit('newUserRegistered', {
                id: userId,
                fullName,
                email,
                phone,
                role,
                created_at: new Date()
            });
            console.log('Emitted newUserRegistered for admin');
        }

        jwt.sign(
            { id: userId, role: role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' },
            (err, token) => {
                if (err) return next(err);
                res.json({
                    success: true,
                    message: 'Registration successful',
                    token: token,
                    role: role,
                    user: {
                        id: userId,
                        fullName,
                        email,
                        role: role
                    }
                });
            }
        );
    } catch (err) {
        console.error("Registration Final Error (registerUserFinal):", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'User with this email or phone already exists' });
        }
        next(err);
    }
};

// @route   GET /api/patients
// @desc    Get all users where role = 'patient'
const getAllPatients = async (req, res, next) => {
    try {
        const [patients] = await db.query(
            'SELECT patient_id as id, fullName, email, phone, status, created_at FROM patients ORDER BY created_at DESC'
        );
        res.json({ success: true, count: patients.length, data: patients });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    forgotPassword,
    verifyOtp,
    checkUser,
    verifyVerificationOtp,
    registerUserFinal,
    sendVerificationOtp,
    getAllPatients
};
