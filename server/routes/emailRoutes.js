const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// --- USER AUTHENTICATION & PASSWORD RESET ---
// Handles sending and verifying OTPs for signup and password recovery.
router.post('/send-otp', emailController.sendOtp);
router.post('/verify-otp', emailController.verifyOtp);
router.post('/reset-password-with-otp', emailController.resetPasswordWithOtp);


// --- BOOKING NOTIFICATIONS ---
// Handles sending transactional emails for booking confirmations and updates.
router.post('/send-confirmation', emailController.sendBookingConfirmation);
router.post('/send-notification', emailController.sendBookingNotification);


module.exports = router;

