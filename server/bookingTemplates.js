const qrcode = require('qrcode');

const getTripIdentifier = (bookingDetails) => {
    if (bookingDetails.type === 'flight' && bookingDetails.origin && bookingDetails.destination) {
        return `${bookingDetails.origin} to ${bookingDetails.destination}`;
    }
    if (bookingDetails.routeName) {
        return bookingDetails.routeName;
    }
    if (bookingDetails.tourName) {
        return bookingDetails.tourName;
    }
    if (bookingDetails.origin && bookingDetails.destination) {
        return `${bookingDetails.origin} to ${bookingDetails.destination}`;
    }
    return 'your trip';
};

const generateConfirmationHtml = async (bookingDetails) => {
    let qrCodeAttachment = null;
    let qrCodeHtmlBlock = ''; // Start with an empty block for the QR code

    try {
        // Only attempt to generate if ticketCode exists and is a string
        if (bookingDetails.ticketCode && typeof bookingDetails.ticketCode === 'string') {
            const qrCodeBuffer = await qrcode.toBuffer(bookingDetails.ticketCode);
            
            // --- FINAL FIX FOR BREVO API ---
            qrCodeAttachment = {
                name: 'qrcode.png', // Brevo expects the property to be 'name'
                content: qrCodeBuffer.toString('base64'), // Convert the data to a Base64 string
                cid: 'qrcode' // This ID links the attachment to the <img> tag
            };
            // --------------------------------

            // If generation is successful, create the HTML block to display it
            qrCodeHtmlBlock = `
                <div style="text-align: center; margin-top: 30px;">
                    <h3 style="color: #333; margin-bottom: 12px;">🎫 Your Ticket</h3>
                    <p style="margin: 0 0 12px;">Scan this QR code at check-in:</p>
                    <div style="padding: 15px; background: #fff; display: inline-block; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                        <img src="cid:qrcode" alt="QR Code" style="width: 140px; height: 140px;"/>
                    </div>
                    <p style="font-size: 1.15em; margin-top: 14px;">Ticket Code:<br><strong style="letter-spacing: 2px; color: #0062e6; font-size: 1.2em;">${bookingDetails.ticketCode}</strong></p>
                </div>`;
        }
    } catch (error) {
        console.error("Could not generate QR code:", error);
        // If it fails, qrCodeHtmlBlock remains empty, and the email will send without it.
    }

    // Safely access passenger and trip data with fallbacks
    const passengers = Array.isArray(bookingDetails.passengers) ? bookingDetails.passengers : [];
    const primaryPassenger = passengers[0] || { firstName: 'Valued Customer' };
    
    const passengerList = passengers.map((p, i) =>
        `<li style="padding: 8px 12px; margin: 6px 0; background: #f0f4ff; border-radius: 6px; font-size: 0.95em;">
            <strong>${p.firstName || ''} ${p.lastName || ''}</strong> <span style="color:#666;">(Seat: ${(bookingDetails.selectedSeats || [])[i] || 'N/A'})</span>
        </li>`
    ).join('');

    const fromLocation = bookingDetails.origin || (bookingDetails.routeName ? bookingDetails.routeName.split(' to ')[0] : 'N/A');
    const toLocation = bookingDetails.destination || (bookingDetails.routeName ? bookingDetails.routeName.split(' to ')[1] : 'N/A');
    const tripName = bookingDetails.type === 'flight' ? bookingDetails.airline : bookingDetails.operator || 'Your Trip';

    const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0062e6, #33aeff); color: white; padding: 25px; text-align: center;">
                <h1 style="margin: 0; font-size: 1.8em;">🎉 Booking Confirmed!</h1>
                <p style="margin: 6px 0 0; font-size: 1.1em;">Your journey awaits, ${primaryPassenger.firstName}!</p>
            </div>

            <div style="padding: 25px 30px;">
                <h2 style="margin-top: 0; color: #0062e6; font-size: 1.4em;">Trip Details</h2>
                <div style="background: #f9fbff; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e6f0ff;">
                    <p style="margin: 6px 0; font-size: 1.05em;"><strong>Trip:</strong> ${tripName}</p>
                    <p style="margin: 6px 0; font-size: 1.05em;"><strong>From:</strong> ${fromLocation}</p>
                    <p style="margin: 6px 0; font-size: 1.05em;"><strong>To:</strong> ${toLocation}</p>
                    <p style="margin: 6px 0; font-size: 1.05em;"><strong>Date:</strong> ${bookingDetails.departureDate || 'N/A'}</p>
                </div>

                <h2 style="color: #0062e6; font-size: 1.4em;">👥 Passengers</h2>
                <ul style="list-style: none; padding: 0; margin: 10px 0 20px;">${passengerList}</ul>

                ${qrCodeHtmlBlock} 
            </div>

            <div style="background-color: #f7f9fc; color: #555; padding: 18px; text-align: center; font-size: 0.9em; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0;">✨ Thank you for booking with <strong>TravelEase</strong>. Have a safe and pleasant journey! ✈️🚌</p>
            </div>
        </div>`;
        
    return {
        htmlBody,
        // Only include attachments if the QR code was successfully created
        attachments: qrCodeAttachment ? [qrCodeAttachment] : []
    };
};

const generateNotificationHtml = (type, bookingDetails) => {
    const passengerName = bookingDetails.passengers[0]?.firstName || 'Valued Customer';
    const tripIdentifier = getTripIdentifier(bookingDetails);
    let title, message, color, emoji, subject;

    if (type === 'updated') {
        title = 'Booking Updated';
        subject = `Update Regarding Your Booking for ${tripIdentifier}`;
        message = `<p>Your booking for <strong>${tripIdentifier}</strong> has been successfully <span style="color:#0062e6;">updated</span>.</p>`;
        color = '#ffc107';
        emoji = '🔔';
    } else {
        title = 'Booking Canceled';
        subject = `Your Booking for ${tripIdentifier} Has Been Canceled`;
        message = `<p>Your booking for <strong>${tripIdentifier}</strong> on <strong>${bookingDetails.departureDate}</strong> has been <span style="color:#d63333;">canceled</span>.</p>`;
        color = '#dc3545';
        emoji = '❌';
    }

    const htmlBody = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background-color: ${color}; color: white; padding: 25px; text-align: center;">
                <h1 style="margin: 0; font-size: 1.8em;">${emoji} ${title}</h1>
            </div>

            <div style="padding: 30px;">
                <p style="font-size: 1.05em;">Hello <strong>${passengerName}</strong>,</p>
                ${message}
                <p>If you have any questions, feel free to reach out to our support team anytime.</p>
                <p style="margin-top: 20px;">Best regards,<br><strong>The TravelEase Team</strong></p>
            </div>

            <div style="background-color: #f7f9fc; color: #555; padding: 18px; text-align: center; font-size: 0.85em; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0;">This is an automated notification. Please do not reply to this email.</p>
            </div>
        </div>`;
    
    return { htmlBody, subject };
};

module.exports = { generateConfirmationHtml, generateNotificationHtml };