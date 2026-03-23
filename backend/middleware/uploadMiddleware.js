const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = (folder) => multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `uploads/${folder}/`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `${folder}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'), false);
};

const profileUpload = multer({
    storage: storage('profiles'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

const proofUpload = multer({
    storage: storage('proofs'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for proofs
    fileFilter
});

module.exports = {
    profileUpload,
    proofUpload
};
