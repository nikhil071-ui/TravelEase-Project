const nodemailer = require('nodemailer');

// Initialize the transporter once and export it
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * A reusable function to send emails.
 * @param {object} mailOptions - The options for the email (to, subject, html, attachments).
 */
const sendEmail = async (mailOptions) => {
    try {
        await transporter.sendMail({
            from: `"TravelEase" <${process.env.EMAIL_USER}>`,
            ...mailOptions,
        });
        console.log(`Email sent successfully to ${mailOptions.to}`);
    } catch (error) {
        console.error(`Error sending email to ${mailOptions.to}:`, error);
        // We throw the error so the controller can handle it
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };
