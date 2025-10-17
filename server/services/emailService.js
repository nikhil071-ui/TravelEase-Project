// server/services/emailService.js
const nodemailer = require('nodemailer');

const sendEmail = async (mailOptions) => {

    // --- START: DIAGNOSTIC CHECK ---
    console.log("--- MAILTRAP DIAGNOSTIC CHECK ---");
    console.log("Host:", process.env.MAILTRAP_HOST);
    console.log("Port:", process.env.MAILTRAP_PORT);
    console.log("User:", process.env.MAILTRAP_USER);
    const pass = process.env.MAILTRAP_PASS;
    console.log("Password Exists:", !!pass); // This safely checks if the password is set
    // --- END: DIAGNOSTIC CHECK ---

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: '"TravelEase" <noreply@travelease.com>',
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.htmlContent,
            attachments: mailOptions.attachments || []
        });

        console.log(`✅ Email successfully trapped in Mailtrap. Message ID: ${info.messageId}`);

    } catch (error) {
        console.error(`❌ Error sending email to ${mailOptions.to}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };