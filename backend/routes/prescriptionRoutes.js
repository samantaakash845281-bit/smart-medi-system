const express = require('express');
const { createPrescription, getPrescriptions } = require('../controllers/prescriptionController');
const { verifyToken } = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');

const router = express.Router();

router.use(verifyToken);

router.post('/', verifyRole('doctor'), createPrescription);
router.get('/', getPrescriptions);

module.exports = router;
