// server/services/emailService.js

const SibApiV3Sdk = require('sib-api-v3-sdk');

// ... (your existing setup code for the SDK)
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; 

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();


const sendEmail = async (mailOptions) => {

    // --- ADD THESE TWO LINES FOR THE FINAL TEST ---
    console.log("--- FINAL DEBUG CHECK ---");
    console.log("Using Sender Email:", process.env.EMAIL_USER);
    const key = process.env.BREVO_API_KEY;
    console.log("Using API Key (first 10 chars):", key ? key.substring(0, 10) + '...' : 'API Key is UNDEFINED');
    // ---------------------------------------------

    try {
        // Set the sender
        sendSmtpEmail.sender = { 
            name: "TravelEase", 
            email: process.env.EMAIL_USER
        };

        // ... (rest of your existing sendEmail function)
        sendSmtpEmail.to = [{ email: mailOptions.to }];
        sendSmtpEmail.subject = mailOptions.subject;
        sendSmtpEmail.htmlContent = mailOptions.htmlContent; // Assuming you pass htmlContent now
        if (mailOptions.attachments) {
            sendSmtpEmail.attachment = mailOptions.attachments;
        }

        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`Email sent successfully to ${mailOptions.to} via Brevo.`);

    } catch (error) {
        console.error(`Error sending email to ${mailOptions.to}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };