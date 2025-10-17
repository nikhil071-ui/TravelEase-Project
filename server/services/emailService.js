// server/services/emailService.js
const axios = require('axios');

const sendEmail = async (mailOptions) => {
    const booking = mailOptions.bookingDetails;
    
    // This is the data that will be sent to Formspree
    const formData = {
        To: mailOptions.to,
        Subject: mailOptions.subject,
        Passenger: `${booking.passengers[0].firstName} ${booking.passengers[0].lastName}`,
        Trip: `${booking.origin} to ${booking.destination}`,
        Airline: booking.airline,
        Ticket_Code: booking.ticketCode,
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