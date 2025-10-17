// server/services/emailService.js
const nodemailer = require('nodemailer');

const sendEmail = async (mailOptions) => {
    try {
        // This transporter connects directly to Gmail using your App Password
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,       // Your full Gmail address
                pass: process.env.GMAIL_APP_PASSWORD, // The 16-character App Password
            },
        });

        // Send the email
        await transporter.sendMail({
            from: `"TravelEase" <${process.env.GMAIL_USER}>`,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.htmlContent,
            attachments: mailOptions.attachments || []
        });

        console.log(`✅ Email sent successfully to ${mailOptions.to} via Gmail.`);

    } catch (error) {
        console.error(`❌ Error sending email to ${mailOptions.to}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };