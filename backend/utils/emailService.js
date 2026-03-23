const nodemailer = require('nodemailer');

// Utilities for sending Notifications

const sendVerificationOTP = async (identifier, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"SmartMedi Team" <${process.env.EMAIL_USER}>`,
            to: identifier,
            subject: 'Verify Your SmartMedi Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0d9488; text-align: center;">SmartMedi Account Verification</h2>
                    <p style="color: #334155; font-size: 16px;">Hello,</p>
                    <p style="color: #334155; font-size: 16px;">Your verification code is: <strong style="font-size: 24px; color: #0f172a;">${otp}</strong></p>
                    <p style="color: #334155; font-size: 16px;">This code will expire in <strong>5 minutes</strong>.</p>
                    <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        If you did not request this code, please ignore this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification OTP.');
    }
};

const sendOTP = async (identifier, otp) => {

    // IMPORTANT: In a production app you wouldn't send emails to "phone numbers" this way. 
    // This assumes the user passed an email address as the identifier.
    // If it's a phone number, you would integrate Twilio here instead.

    console.log(`\n================================`);
    console.log(`[REAL EMAIL SERVICE INITIATED]`);
    console.log(`To: ${identifier}`);
    console.log(`================================\n`);

    try {
        // Create a transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // HTML Email Template
        const mailOptions = {
            from: `"SmartMedi Support" <${process.env.EMAIL_USER}>`,
            to: identifier,
            subject: 'Your Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0d9488; text-align: center;">SmartMedi Password Reset</h2>
                    <p style="color: #334155; font-size: 16px;">Hello,</p>
                    <p style="color: #334155; font-size: 16px;">We received a request to reset the password for your account associated with this email address.</p>
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
                    </div>
                    <p style="color: #334155; font-size: 14px;"><strong>Note:</strong> This OTP is valid for exactly <strong>10 minutes</strong>. Do not share this code with anyone.</p>
                    <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        If you did not request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                </div>
            `
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP via Email. Please check your SMTP configuration.');
    }
};

const sendBookingConfirmation = async (recipients, appointment, receiptPath) => {
    /**
     * @param {Object} recipients - { patientEmail, doctorEmail, adminEmail, patientName }
     * @param {Object} appointment - { doctorName, date, time, amount, transactionId }
     */
    console.log(`\n================================`);
    console.log(`[BOOKING NOTIFICATION]`);
    console.log(`To Patient: ${recipients.patientEmail}`);
    console.log(`To Doctor: ${recipients.doctorEmail}`);
    console.log(`================================\n`);

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Prepare email list
        const toEmails = [recipients.patientEmail];
        if (recipients.doctorEmail) toEmails.push(recipients.doctorEmail);
        if (process.env.ADMIN_EMAIL) toEmails.push(process.env.ADMIN_EMAIL);

        const mailOptions = {
            from: `"SMMS Healthcare" <${process.env.EMAIL_USER}>`,
            to: toEmails.join(', '),
            subject: `Appointment Confirmed - ${appointment.transactionId}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0; font-size: 32px; letter-spacing: -1px;">SMMS</h1>
                        <p style="color: #64748b; margin: 5px 0; font-weight: 500;">Smart Medical Management System</p>
                    </div>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #166534; margin: 0; font-size: 18px;">Payment Verified & Booking Confirmed</h2>
                    </div>

                    <p style="font-size: 16px;">Hello <strong>${recipients.patientName}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">Your appointment has been successfully confirmed. A professional medical receipt is attached for your records.</p>
                    
                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">Appointment Summary</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Specialist:</td>
                                <td style="padding: 10px 0; font-size: 15px; font-weight: bold;">Dr. ${appointment.doctorName?.replace('Dr. ', '')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Date:</td>
                                <td style="padding: 10px 0; font-size: 15px; font-weight: bold;">${appointment.date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Time Slot:</td>
                                <td style="padding: 10px 0; font-size: 15px; font-weight: bold;">${appointment.time}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Transaction Amount:</td>
                                <td style="padding: 10px 0; font-size: 18px; font-weight: bold; color: #2563eb;">INR ${parseFloat(appointment.amount).toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; font-weight: 500;">Note: Please arrive 15 minutes before your scheduled time.</p>
                    
                    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <p style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 5px;">Thank you for using SMMS</p>
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">This is an automated notification. Please do not reply.</p>
                    </div>
                </div>
            `,
            attachments: receiptPath ? [
                {
                    filename: `Appointment_Receipt_${appointment.transactionId}.pdf`,
                    path: receiptPath
                }
            ] : []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent to all recipients:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending multi-recipient booking confirmation email:', error);
        return false;
    }
};

const sendDoctorCredentials = async (personalEmail, generatedEmail, plainPassword, doctorName) => {
    console.log(`\n================================`);
    console.log(`[DOCTOR CREDENTIALS NOTIFICATION]`);
    console.log(`To: ${personalEmail}`);
    console.log(`Generated Login Email: ${generatedEmail}`);
    console.log(`================================\n`);

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"SmartMedi Administration" <${process.env.EMAIL_USER}>`,
            to: personalEmail,
            subject: 'Welcome to SmartMedi – Your Login Credentials',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0; font-size: 28px;">SmartMedi</h1>
                        <p style="color: #64748b; margin: 5px 0; font-weight: 500;">Healthcare Management System</p>
                    </div>
                    
                    <h2 style="color: #1e293b; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Welcome, Dr. ${doctorName}</h2>
                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your professional profile has been successfully created. Below are your official login credentials for the SmartMedi Doctor Portal.</p>
                    
                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">Login Credentials</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px; width: 40%;">Portal Email:</td>
                                <td style="padding: 10px 0; color: #2563eb; font-size: 15px; font-weight: bold;">${generatedEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b; font-size: 14px;">Temporary Password:</td>
                                <td style="padding: 10px 0; color: #1e293b; font-size: 15px; font-weight: bold; font-family: monospace; background: #fff; padding-left: 10px; border-radius: 4px;">${plainPassword}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background-color: #fff7ed; padding: 15px; border-radius: 10px; border: 1px solid #ffedd5; margin-bottom: 25px;">
                        <p style="color: #9a3412; font-size: 13px; margin: 0; font-weight: 500;">
                            <strong>Security Note:</strong> For your protection, you will be required to change this temporary password upon your first login.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://localhost:3000/login" style="background-color: #2563eb; color: #ffffff; padding: 14px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Login to Portal</a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; margin-top: 30px; text-align: center;">If you have any issues logging in, please contact the IT administration department.</p>
                    
                    <div style="color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
                        <p>SmartMedi Healthcare System | Digital Transformation Team</p>
                        <p>&copy; 2026 SmartMedi System. Secure Administrative Communication.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Credentials email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending credentials email:', error);
        return false;
    }
};

module.exports = {
    sendOTP,
    sendVerificationOTP,
    sendBookingConfirmation,
    sendDoctorCredentials
};
