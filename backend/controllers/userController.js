const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// Set up Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename: function (req, file, cb) {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only standard image files are allowed.'));
    }
});

const getProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const role = req.user.role; // Extract role from verified token

        let tableName = 'patients';
        let idField = 'id';

        if (role === 'doctor') {
            tableName = 'doctors';
            idField = 'id';
        } else if (role === 'admin') {
            tableName = 'admins';
            idField = 'id';
        }

        const [users] = await db.query(
            `SELECT ${idField} as id, fullName, email FROM ${tableName} WHERE ${idField} = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found in system' });
        }

        const userObj = users[0];
        res.json({
            success: true,
            data: { ...userObj, name: userObj.fullName, role }
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const role = req.user.role;

        // Security Check: Only allow users to update their own profile (unless admin)
        if (role !== 'admin' && String(req.user.id) !== String(userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized to update this profile" });
        }

        let tableName = 'patients';
        let idField = 'id';

        if (role === 'doctor') {
            tableName = 'doctors';
            idField = 'id';
        } else if (role === 'admin') {
            tableName = 'admins';
            idField = 'id';
        }

        const { fullName, phone, gender, dob, address, specialization, about } = req.body;
        
        if (!fullName) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        let profileImagePath = null;
        if (req.file) {
            profileImagePath = `/uploads/profiles/${req.file.filename}`;
        }

        const removePhoto = req.body.remove_photo === 'true' || req.body.remove_photo === true;

        if (tableName === 'patients') {
            if (removePhoto) {
                await db.query(`UPDATE ${tableName} SET fullName = ?, phone = ?, gender = ?, dob = ?, address = ?, about = ?, profile_image = NULL WHERE ${idField} = ?`, [fullName, phone, gender, dob, address, about, userId]);
            } else if (profileImagePath) {
                await db.query(`UPDATE ${tableName} SET fullName = ?, phone = ?, gender = ?, dob = ?, address = ?, about = ?, profile_image = ? WHERE ${idField} = ?`, [fullName, phone, gender, dob, address, about, profileImagePath, userId]);
            } else {
                await db.query(`UPDATE ${tableName} SET fullName = ?, phone = ?, gender = ?, dob = ?, address = ?, about = ? WHERE ${idField} = ?`, [fullName, phone, gender, dob, address, about, userId]);
            }
        } else if (tableName === 'doctors') {
            if (removePhoto) {
                await db.query(`UPDATE ${tableName} SET fullName = ?, specialization = ?, about = ?, profile_image = NULL WHERE ${idField} = ?`, [fullName, specialization, about, userId]);
            } else if (profileImagePath) {
                await db.query(`UPDATE ${tableName} SET fullName = ?, specialization = ?, about = ?, profile_image = ? WHERE ${idField} = ?`, [fullName, specialization, about, profileImagePath, userId]);
            } else {
                await db.query(`UPDATE ${tableName} SET fullName = ?, specialization = ?, about = ? WHERE ${idField} = ?`, [fullName, specialization, about, userId]);
            }
        } else {
            if (removePhoto) {
                await db.query(`UPDATE ${tableName} SET fullName = ?, about = ?, profile_image = NULL WHERE ${idField} = ?`, [fullName, about, userId]);
            } else if (profileImagePath) {
                await db.query(`UPDATE ${tableName} SET fullName = ?, about = ?, profile_image = ? WHERE ${idField} = ?`, [fullName, about, profileImagePath, userId]);
            } else {
                await db.query(`UPDATE ${tableName} SET fullName = ?, about = ? WHERE ${idField} = ?`, [fullName, about, userId]);
            }
        }

        const [users] = await db.query(
            `SELECT ${idField} as id, fullName, email, profile_image FROM ${tableName} WHERE ${idField} = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found after update' });
        }

        const updatedUser = users[0];
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { ...updatedUser, name: updatedUser.fullName, role }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    upload
};
