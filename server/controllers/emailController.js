const admin = require('firebase-admin');
const { sendEmail } = require('../services/emailService');
const { generateConfirmationHtml, generateNotificationHtml } = require('../bookingTemplates');

// In-memory storage for OTPs.
const otpStore = {};

// --- OTP and Password Reset Functions (No changes needed) ---
exports.sendOtp = async (req, res) => {
    // ... (This function is correct)
};

exports.verifyOtp = (req, res) => {
    // ... (This function is correct)
};

exports.resetPasswordWithOtp = async (req, res) => {
    // ... (This function is correct)
};


// --- REFACTORED BOOKING EMAIL FUNCTIONS ---

exports.sendBookingConfirmation = async (req, res) => {
    try {
        const { to, subject, bookingDetails } = req.body;
        if (!to || !subject || !bookingDetails) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        
        const { htmlBody, attachments } = await generateConfirmationHtml(bookingDetails);
        
        // --- FIX: Renamed 'html' to 'htmlContent' ---
        await sendEmail({ to, subject, htmlContent: htmlBody, attachments });
        
        res.status(200).json({ message: 'Confirmation email sent successfully!' });

    } catch (error) {
        console.error('Error sending confirmation:', error);
        res.status(500).send('Failed to send confirmation email.');
    }
};

exports.sendBookingNotification = async (req, res) => {
    try {
        const { to, type, bookingDetails } = req.body;
        if (!to || !type || !bookingDetails) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        
        const { htmlBody, subject: generatedSubject } = generateNotificationHtml(type, bookingDetails);
        
        // --- FIX: Renamed 'html' to 'htmlContent' ---
        await sendEmail({ to, subject: generatedSubject, htmlContent: htmlBody });

        res.status(200).json({ message: 'Notification email sent successfully!' });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Failed to send notification email.');
    }
};