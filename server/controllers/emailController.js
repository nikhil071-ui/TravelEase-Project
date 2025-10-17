const admin = require('firebase-admin');
const { sendEmail } = require('../services/emailService');
const { generateConfirmationHtml, generateNotificationHtml } = require('../bookingTemplates');

// --- NEW: Initialize Firestore ---
// This gives us access to the database.
const db = admin.firestore();

// --- DELETED: The old otpStore is no longer needed. ---
// const otpStore = {}; 

// --- UPDATED: `sendOtp` now saves to Firestore ---
exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // Expiry time in milliseconds

    try {
        // Save the OTP to a document in the 'otps' collection, using the email as the document ID.
        const otpRef = db.collection('otps').doc(email);
        await otpRef.set({ otp, expires });

        await sendEmail({
            to: email,
            subject: 'Your Verification Code for TravelEase',
            htmlContent: `<p>Your OTP for TravelEase is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
        });
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error("Error in sendOtp:", error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

// --- UPDATED: `verifyOtp` now checks Firestore ---
exports.verifyOtp = async (req, res) => {
    const { email, otp, usage } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpRef = db.collection('otps').doc(email);
    const docSnap = await otpRef.get();

    if (!docSnap.exists) {
        return res.status(400).json({ message: 'OTP is invalid or has expired.' });
    }

    const stored = docSnap.data();
    if (stored.otp !== otp || Date.now() > stored.expires) {
        await otpRef.delete(); // Clean up expired/invalid OTP
        return res.status(400).json({ message: 'OTP is invalid or has expired.' });
    }

    if (usage === 'signup') {
        await otpRef.delete(); // OTP is single-use for signup
    }
    
    res.status(200).json({ message: 'OTP verified successfully' });
};

// --- UPDATED: `resetPasswordWithOtp` now checks and deletes from Firestore ---
exports.resetPasswordWithOtp = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    const otpRef = db.collection('otps').doc(email);
    const docSnap = await otpRef.get();

    if (!docSnap.exists) {
        return res.status(400).json({ message: 'Invalid or expired OTP. Please start over.' });
    }
    
    const stored = docSnap.data();
    if (stored.otp !== otp || Date.now() > stored.expires) {
        await otpRef.delete(); // Clean up
        return res.status(400).json({ message: 'Invalid or expired OTP. Please start over.' });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        
        await otpRef.delete(); // OTP is single-use, delete it after successful password reset
        
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: 'Failed to reset password.' });
    }
};


// --- Booking Email Functions (No changes needed) ---
exports.sendBookingConfirmation = async (req, res) => {
    try {
        const { to, subject, bookingDetails } = req.body;
        if (!to || !subject || !bookingDetails) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const { htmlBody, attachments } = await generateConfirmationHtml(bookingDetails);
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
        await sendEmail({ to, subject: generatedSubject, htmlContent: htmlBody });
        res.status(200).json({ message: 'Notification email sent successfully!' });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send('Failed to send notification email.');
    }
};