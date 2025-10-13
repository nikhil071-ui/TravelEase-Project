const admin = require('firebase-admin');
const { sendEmail } = require('../services/emailService');
// Corrected path to the templates file
const { generateConfirmationHtml, generateNotificationHtml } = require('../bookingTemplates');

// In-memory storage for OTPs.
const otpStore = {};

// --- OTP and Password Reset Functions (No changes needed) ---
exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    try {
        await sendEmail({
            to: email,
            subject: 'Your Verification Code for TravelEase',
            html: `<p>Your OTP for TravelEase is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
        });
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

exports.verifyOtp = (req, res) => {
    const { email, otp, usage } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const stored = otpStore[email];
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        delete otpStore[email];
        return res.status(400).json({ message: 'OTP is invalid or has expired.' });
    }
    if (usage === 'signup') {
        delete otpStore[email];
    }
    res.status(200).json({ message: 'OTP verified successfully' });
};

exports.resetPasswordWithOtp = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    const stored = otpStore[email];
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        return res.status(400).json({ message: 'Invalid or expired OTP. Please start over.' });
    }
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        delete otpStore[email];
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reset password.' });
    }
};


// --- REFACTORED BOOKING EMAIL FUNCTIONS ---

exports.sendBookingConfirmation = async (req, res) => {
    try {
        const { to, subject, bookingDetails } = req.body;
        if (!to || !subject || !bookingDetails) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        
        // Use the template to generate the email content
        const { htmlBody, attachments } = await generateConfirmationHtml(bookingDetails);
        
        // Use the email service to send the email
        await sendEmail({ to, subject, html: htmlBody, attachments });
        res.status(200).json({ message: 'Confirmation email sent successfully!' });

    } catch (error) {
        console.error('Error sending confirmation:', error);
        res.status(500).send('Failed to send confirmation email.');
    }
};

exports.sendBookingNotification = async (req, res) => {
    try {
        const { to, subject, type, bookingDetails } = req.body;
        if (!to || !type || !bookingDetails) { // 'subject' is now generated, so it's not required in the request
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        
        // --- MODIFICATION 1: Get both htmlBody and the new subject from the template ---
        const { htmlBody, subject: generatedSubject } = generateNotificationHtml(type, bookingDetails);
        
        // --- MODIFICATION 2: Use the generated subject in the sendEmail call ---
        await sendEmail({ to, subject: generatedSubject, html: htmlBody });
        res.status(200).json({ message: 'Notification email sent successfully!' });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Failed to send notification email.');
    }
};

