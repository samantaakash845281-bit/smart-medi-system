const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { 
    generateAdminFinancialReport, 
    generateDoctorSummaryReport, 
    generatePatientHistoryReport 
} = require('../utils/reportGenerator');

// @desc    Export Admin Financial Report
const exportAdminFinancial = async (req, res, next) => {
    try {
        const [transactions] = await db.query(`
            SELECT py.*, pat.fullName AS patientName, d.fullName AS doctorName
            FROM payments py
            JOIN patients pat ON py.patient_id = pat.id
            JOIN doctors d ON py.doctor_id = d.id
            ORDER BY py.payment_date DESC
        `);

        const totalRevenue = transactions.reduce((sum, p) => 
            (p.payment_status?.toLowerCase() === 'paid' || p.payment_status?.toLowerCase() === 'verified') ? sum + parseFloat(p.amount) : sum, 0
        );

        const filePath = await generateAdminFinancialReport({
            transactions,
            totalRevenue,
            totalTransactions: transactions.length
        });

        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};

// @desc    Export Doctor Summary Report
const exportDoctorSummary = async (req, res, next) => {
    try {
        const doctor_id = req.user.id;

        // Fetch Stats
        const [stats] = await db.query(`
            SELECT 
                COUNT(DISTINCT patient_id) as totalPatients,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedAppointments
            FROM appointments 
            WHERE doctor_id = ?
        `, [doctor_id]);

        const [earnings] = await db.query(`
            SELECT SUM(amount) as totalEarnings 
            FROM payments 
            WHERE doctor_id = ? AND (payment_status = 'paid' OR payment_status = 'verified')
        `, [doctor_id]);

        const [recentAppointments] = await db.query(`
            SELECT a.*, pat.fullName as patientName
            FROM appointments a
            JOIN patients pat ON a.patient_id = pat.id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date DESC, a.time_slot DESC
            LIMIT 50
        `, [doctor_id]);

        const [docInfo] = await db.query('SELECT fullName FROM doctors WHERE id = ?', [doctor_id]);
        const doctorName = docInfo[0]?.fullName || 'Doctor';

        const filePath = await generateDoctorSummaryReport({
            doctorName,
            totalPatients: stats[0].totalPatients || 0,
            completedAppointments: stats[0].completedAppointments || 0,
            totalEarnings: earnings[0].totalEarnings || 0,
            recentAppointments
        });

        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};

// @desc    Export Patient Medical History
const exportPatientHistory = async (req, res, next) => {
    try {
        const patient_id = req.user.id;

        const [appointments] = await db.query(`
            SELECT a.*, d.fullName as doctorName, d.specialization as department
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        `, [patient_id]);

        const [prescriptions] = await db.query(`
            SELECT p.*, d.fullName as doctorName
            FROM prescriptions p
            JOIN doctors d ON p.doctor_id = d.id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC
        `, [patient_id]);

        const [patInfo] = await db.query('SELECT fullName FROM patients WHERE id = ?', [patient_id]);
        const patientName = patInfo[0]?.fullName || 'Patient';

        const filePath = await generatePatientHistoryReport({
            patientName,
            appointments,
            prescriptions
        });

        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    exportAdminFinancial,
    exportDoctorSummary,
    exportPatientHistory
};
