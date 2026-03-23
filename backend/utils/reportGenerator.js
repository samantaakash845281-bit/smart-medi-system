const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates an Admin Financial Report PDF.
 */
const generateAdminFinancialReport = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const fileName = `financial_report_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/reports', fileName);
            
            // Ensure directory exists
            if (!fs.existsSync(path.join(__dirname, '../uploads/reports'))) {
                fs.mkdirSync(path.join(__dirname, '../uploads/reports'), { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.rect(0, 0, doc.page.width, 100).fill('#1e293b');
            doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('SMARTMEDI', 50, 30, { continued: true }).fillColor('#94a3b8').text(' SYSTEM');
            doc.fontSize(10).font('Helvetica').fillColor('#cbd5e1').text('Financial Audit & Transaction Report', 50, 60);
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff').text(`Generated on: ${new Date().toLocaleDateString()}`, 400, 45, { align: 'right' });

            // Summary Stats
            doc.rect(50, 120, 500, 60).fill('#f8fafc');
            doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold').text('TOTAL REVENUE', 70, 135);
            doc.fillColor('#0f172a').fontSize(20).text(`INR ${data.totalRevenue.toLocaleString()}`, 70, 150);
            
            doc.fillColor('#64748b').fontSize(10).text('TOTAL TRANSACTIONS', 350, 135);
            doc.fillColor('#0f172a').fontSize(20).text(`${data.totalTransactions}`, 350, 150);

            // Table Header
            const tableTop = 210;
            doc.rect(50, tableTop, 500, 20).fill('#f1f5f9');
            doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
            doc.text('TXN ID', 60, tableTop + 6);
            doc.text('DATE', 150, tableTop + 6);
            doc.text('PARTIES', 250, tableTop + 6);
            doc.text('AMOUNT', 400, tableTop + 6, { align: 'right', width: 60 });
            doc.text('STATUS', 480, tableTop + 6);

            // Rows
            let currentY = tableTop + 25;
            data.transactions.forEach((txn, i) => {
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }
                doc.fillColor('#334155').fontSize(8).font('Helvetica');
                doc.text(txn.transaction_id || 'N/A', 60, currentY);
                doc.text(new Date(txn.payment_date).toLocaleDateString(), 150, currentY);
                doc.text(`P: ${txn.patientName}\nD: ${txn.doctorName}`, 250, currentY, { width: 140 });
                doc.text(`INR ${parseFloat(txn.amount).toFixed(2)}`, 400, currentY, { align: 'right', width: 60 });
                doc.text(txn.payment_status.toUpperCase(), 480, currentY);
                
                doc.moveTo(50, currentY + 20).lineTo(550, currentY + 20).stroke('#f1f5f9');
                currentY += 30;
            });

            doc.end();
            stream.on('finish', () => resolve(filePath));
        } catch (error) { reject(error); }
    });
};

/**
 * Generates a Doctor Summary Report PDF.
 */
const generateDoctorSummaryReport = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const fileName = `doctor_report_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/reports', fileName);
            
            if (!fs.existsSync(path.join(__dirname, '../uploads/reports'))) {
                fs.mkdirSync(path.join(__dirname, '../uploads/reports'), { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.rect(0, 0, doc.page.width, 100).fill('#2563eb');
            doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('SMARTMEDI', 50, 30);
            doc.fontSize(12).font('Helvetica').text(`Dr. ${data.doctorName}`, 50, 60);
            doc.fontSize(10).text(`Performance Summary Report`, 400, 45, { align: 'right' });

            // Summary Info
            doc.rect(50, 120, 500, 100).fill('#f0f9ff');
            doc.fillColor('#0369a1').fontSize(14).font('Helvetica-Bold').text('Quick Stats', 70, 140);
            doc.fontSize(10).font('Helvetica').text(`Total Patients: ${data.totalPatients}`, 70, 165);
            doc.text(`Completed Consultations: ${data.completedAppointments}`, 70, 180);
            doc.fontSize(18).font('Helvetica-Bold').text(`Total Earnings: INR ${data.totalEarnings.toLocaleString()}`, 300, 170);

            // Recent Patients
            doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('Recent Consultations', 50, 240);
            let currentY = 260;
            data.recentAppointments.slice(0, 15).forEach(apt => {
                doc.fontSize(10).font('Helvetica').fillColor('#475569');
                doc.text(`${new Date(apt.appointment_date).toLocaleDateString()} - ${apt.patientName}`, 50, currentY);
                doc.text(apt.status.toUpperCase(), 450, currentY, { align: 'right', width: 100 });
                doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).stroke('#e2e8f0');
                currentY += 25;
            });

            doc.end();
            stream.on('finish', () => resolve(filePath));
        } catch (error) { reject(error); }
    });
};

/**
 * Generates a Patient Medical History Report PDF.
 */
const generatePatientHistoryReport = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const fileName = `medical_history_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '../uploads/reports', fileName);
            
            if (!fs.existsSync(path.join(__dirname, '../uploads/reports'))) {
                fs.mkdirSync(path.join(__dirname, '../uploads/reports'), { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            doc.rect(0, 0, doc.page.width, 100).fill('#0f172a');
            doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('SMARTMEDI', 50, 30);
            doc.fontSize(12).font('Helvetica').text(data.patientName, 50, 60);
            doc.fontSize(10).text('Medical History Summary', 400, 45, { align: 'right' });

            // Visit History
            doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold').text('Visit History', 50, 130);
            let currentY = 150;
            data.appointments.forEach(apt => {
                if (currentY > 700) { doc.addPage(); currentY = 50; }
                doc.fontSize(10).font('Helvetica-Bold').text(`${new Date(apt.appointment_date).toLocaleDateString()} - Dr. ${apt.doctorName}`, 50, currentY);
                doc.fontSize(9).font('Helvetica').text(`Department: ${apt.department || 'General'} | Status: ${apt.status}`, 50, currentY + 12);
                doc.moveTo(50, currentY + 28).lineTo(550, currentY + 28).stroke('#f1f5f9');
                currentY += 40;
            });

            // Active Prescriptions if any
            if (data.prescriptions && data.prescriptions.length > 0) {
                doc.addPage();
                doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold').text('Active Prescriptions', 50, 50);
                currentY = 80;
                data.prescriptions.forEach(pre => {
                    doc.fontSize(10).font('Helvetica-Bold').text(pre.medicine_name, 50, currentY);
                    doc.fontSize(9).font('Helvetica').text(`${pre.dosage} - ${pre.instructions}`, 50, currentY + 12);
                    currentY += 35;
                });
            }

            doc.end();
            stream.on('finish', () => resolve(filePath));
        } catch (error) { reject(error); }
    });
};

module.exports = {
    generateAdminFinancialReport,
    generateDoctorSummaryReport,
    generatePatientHistoryReport
};
