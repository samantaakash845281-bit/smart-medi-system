require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
    try {
        console.log("Testing SMTP connection for:", process.env.EMAIL_USER);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'SMTP Test',
            text: 'If you see this, SMTP is working.'
        });
        console.log("Success! Message ID:", info.messageId);
    } catch (e) {
        console.error("\n=============================");
        console.error("SMTP Error Detail:");
        console.error("CODE:", e.code);
        console.error("RESPONSE:", e.response);
        console.error("COMMAND:", e.command);
        console.error("=============================\n");
    }
}
testMail();
