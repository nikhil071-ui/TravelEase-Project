// server/services/emailService.js
const axios = require('axios');

const sendEmail = async (mailOptions) => {
    // --- SAFETY CHECK ---
    // This prevents the "Cannot read properties of undefined" error.
    if (!mailOptions.bookingDetails) {
        console.error("❌ Error: bookingDetails is missing from mailOptions.");
        throw new Error("Cannot send email without booking details.");
    }
    
    const booking = mailOptions.bookingDetails;
    
    // This is the data that will be sent to Formspree
    const formData = {
        To: mailOptions.to,
        Subject: mailOptions.subject,
        // Using optional chaining (?.) for extra safety
        Passenger: `${booking.passengers?.[0]?.firstName || ''} ${booking.passengers?.[0]?.lastName || ''}`,
        Trip: `${booking.origin || 'N/A'} to ${booking.destination || 'N/A'}`,
        Airline: booking.airline || 'N/A',
        Ticket_Code: booking.ticketCode || 'N/A',
    };

    try {
        console.log("Attempting to send email via Formspree...");

        await axios.post(process.env.FORMSPREE_ENDPOINT, formData, {
            headers: { 'Accept': 'application/json' }
        });

        console.log(`✅ Email sent successfully to ${mailOptions.to} via Formspree.`);

    } catch (error) {
        console.error(`❌ Error sending email via Formspree:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };