// server/services/emailService.js

const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configure the Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // We will add this to Render

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

/**
 * A reusable function to send emails using Brevo.
 * @param {object} mailOptions - The options for the email (to, subject, html).
 */
const sendEmail = async (mailOptions) => {
    try {
        // Set the sender
        sendSmtpEmail.sender = { 
            name: "TravelEase", 
            email: process.env.EMAIL_USER // This should be the email you verified with Brevo
        };

        // Set the recipient(s)
        sendSmtpEmail.to = [{ email: mailOptions.to }];
        
        // Set email content
        sendSmtpEmail.subject = mailOptions.subject;
        sendSmtpEmail.htmlContent = mailOptions.html;

        // Send the email
        await apiInstance.sendTransacEmail(sendSmtpEmail);

        console.log(`Email sent successfully to ${mailOptions.to} via Brevo.`);

    } catch (error) {
        console.error(`Error sending email to ${mailOptions.to}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };