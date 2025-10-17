const admin = require('firebase-admin');
const { sendEmail } = require('../services/emailService');
const { generateConfirmationHtml, generateNotificationHtml } = require('../bookingTemplates');

// --- NEW: Initialize Firestore ---
const db = admin.firestore();

// --- Firestore OTP Functions (These are now correct and persistent) ---
exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minute expiry

    try {
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

exports.verifyOtp = async (req, res) => {
    const { email, otp, usage } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }
    const otpRef = db.collection('otps').doc(email);
    const docSnap = await otpRef.get();

    if (!docSnap.exists || docSnap.data().otp !== otp || Date.now() > docSnap.data().expires) {
        if (docSnap.exists) await otpRef.delete();
        return res.status(400).json({ message: 'OTP is invalid or has expired.' });
    }

    if (usage === 'signup') {
        await otpRef.delete();
    }
    
    res.status(200).json({ message: 'OTP verified successfully' });
};

exports.resetPasswordWithOtp = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    const otpRef = db.collection('otps').doc(email);
    const docSnap = await otpRef.get();

    if (!docSnap.exists || docSnap.data().otp !== otp || Date.now() > docSnap.data().expires) {
        if (docSnap.exists) await otpRef.delete();
        return res.status(400).json({ message: 'Invalid or expired OTP. Please start over.' });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(userRecord.uid, { password: newPassword });
        await otpRef.delete();
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: 'Failed to reset password.' });
    }
};

// --- Booking Email Functions ---

exports.sendBookingConfirmation = async (req, res) => {
    try {
        const { to, subject, bookingDetails } = req.body;
        if (!to || !subject || !bookingDetails) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        
        // --- FIX: Use the template to generate the email content first ---
        const { htmlBody, attachments } = await generateConfirmationHtml(bookingDetails);
        
        // --- FIX: Pass the generated content to the email service ---
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