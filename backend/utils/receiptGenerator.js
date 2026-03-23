const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a professional medical receipt in PDF format.
 * @param {Object} data - Receipt data
 * @param {string} data.patientName
 * @param {string} data.doctorName
 * @param {string} data.date
 * @param {string} data.time
 * @param {number} data.amount
 * @param {string} data.transactionId
 * @param {string} [data.paymentMethod] - Optional payment method
 * @returns {Promise<string>} - Path to the generated PDF
 */
const generateReceipt = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                margin: 50,
                size: 'A4'
            });
            const sanitizedTxnId = String(data.transactionId || 'SM-DEMO').replace(/\s+/g, '_');
            const fileName = `receipt_${sanitizedTxnId}.pdf`;
            const filePath = path.join(__dirname, '../uploads/receipts', fileName);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // --- HEADER ---
            doc.rect(0, 0, doc.page.width, 100).fill('#f8fafc');
            
            doc.fillColor('#2563eb')
               .fontSize(24)
               .font('Helvetica-Bold')
               .text('SMARTMEDI', 50, 40, { continued: true })
               .fillColor('#64748b')
               .text(' SYSTEM');
            
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#2563eb')
               .text('Appointment Receipt', 50, 70);

            doc.fontSize(10)
               .font('Helvetica-Bold')
               .fillColor('#475569')
               .text(`Booking ID: ${data.id || 'N/A'}`, 350, 45, { align: 'right' });
            
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Receipt Date: ${new Date().toLocaleDateString('en-GB')}`, 350, 60, { align: 'right' });

            // --- SEPARATOR ---
            doc.moveTo(50, 110)
               .lineTo(550, 110)
               .lineWidth(1)
               .stroke('#e2e8f0');

            // --- PATIENT & DOCTOR INFO ---
            doc.fontSize(10).fillColor('#64748b').text('PATIENT DETAILS:', 50, 140);
            doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold').text(data.patientName, 50, 155);
            doc.fontSize(10).font('Helvetica').text(`Email: ${data.patientEmail || 'N/A'}`, 50, 175);

            doc.fontSize(10).fillColor('#64748b').text('DOCTOR DETAILS:', 300, 140);
            doc.fontSize(14).fillColor('#1e293b').font('Helvetica-Bold').text(`Dr. ${data.doctorName?.replace('Dr. ', '')}`, 300, 155);
            doc.fontSize(10).font('Helvetica').text(`Dept: ${data.department || 'General Consultation'}`, 300, 175);

            // --- APPOINTMENT DETAILS ---
            doc.rect(50, 210, 500, 40).fill('#f1f5f9');
            doc.fillColor('#475569').font('Helvetica-Bold').text('APPOINTMENT SCHEDULE', 60, 225);
            doc.fillColor('#2563eb').text(`${data.date} | ${data.time}`, 350, 225, { align: 'right', width: 190 });

            // --- FINANCIAL TABLE ---
            const tableTop = 290;
            doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold');
            doc.text('DESCRIPTION', 50, tableTop);
            doc.text('AMOUNT', 400, tableTop, { align: 'right', width: 150 });

            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#e2e8f0');

            const itemY = tableTop + 30;
            doc.fontSize(11).fillColor('#1e293b').font('Helvetica');
            doc.text(`Consultation with Dr. ${data.doctorName?.replace('Dr. ', '')}`, 50, itemY);
            doc.text(`INR ${parseFloat(data.amount || 0).toFixed(2)}`, 400, itemY, { align: 'right', width: 150 });

            doc.moveTo(50, itemY + 40).lineTo(550, itemY + 40).stroke('#cbd5e1');

            // --- TOTAL ---
            const totalY = itemY + 65;
            doc.fontSize(16).fillColor('#1e293b').font('Helvetica-Bold');
            doc.text('TOTAL PAID (INR)', 50, totalY);
            doc.fillColor('#2563eb').text(`INR ${parseFloat(data.amount || 0).toFixed(2)}`, 400, totalY, { align: 'right', width: 150 });

            // --- STATUS BADGE ---
            doc.rect(400, totalY + 40, 150, 30).fill('#ecfdf5');
            doc.fillColor('#059669').fontSize(12).font('Helvetica-Bold').text('STATUS: PAID', 400, totalY + 50, { align: 'center', width: 150 });

            // --- INFO ---
            doc.fontSize(10).fillColor('#64748b').font('Helvetica');
            doc.text(`Payment ID: ${data.transactionId}`, 50, totalY + 50);
            doc.text(`Booking Status: Confirmed ✅`, 50, totalY + 65);

            // --- FOOTER ---
            doc.rect(0, 750, doc.page.width, 100).fill('#f8fafc');
            doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text('Thank you for using SMMS', 50, 770, { align: 'center', width: 500 });
            doc.fontSize(8).fillColor('#94a3b8').font('Helvetica').text('This is a verified digital receipt. Care beyond excellence.', 50, 790, { align: 'center', width: 500 });
            doc.text('Smart Medical Management System | support@smms.com | www.smms.com', 50, 805, { align: 'center', width: 500 });

            doc.end();

            stream.on('finish', () => {
                resolve(filePath);
            });

            stream.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateReceipt };
