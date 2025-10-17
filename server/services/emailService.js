// server/services/emailService.js
const nodemailer = require('nodemailer');

const sendEmail = async (mailOptions) => {
    try {
        // Create a transporter using your Mailtrap Sandbox credentials
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
        });

        // Send the email
        const info = await transporter.sendMail({
            from: '"TravelEase" <noreply@travelease.com>', // This can be any address for testing
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.htmlContent, // Make sure your controller provides this
            attachments: mailOptions.attachments || []
        });

        console.log(`✅ Email successfully trapped in Mailtrap. Message ID: ${info.messageId}`);

    } catch (error) {
        console.error(`❌ Error sending email to ${mailOptions.to}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };