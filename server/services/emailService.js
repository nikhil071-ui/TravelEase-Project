// server/services/emailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

const sendEmail = async (mailOptions) => {
    // Configure the Brevo API client
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY; // This must be the v3 key ('xkeysib-...')

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    try {
        // Set the sender (must be a verified sender in your Brevo account)
        sendSmtpEmail.sender = { 
            name: "TravelEase", 
            email: process.env.EMAIL_USER 
        };

        // Set the recipient
        sendSmtpEmail.to = [{ email: mailOptions.to }];
        
        // Set email content
        sendSmtpEmail.subject = mailOptions.subject;
        sendSmtpEmail.htmlContent = mailOptions.htmlContent;
        sendSmtpEmail.attachment = mailOptions.attachments;

        // Send the email
        await apiInstance.sendTransacEmail(sendSmtpEmail);

        console.log(`✅ Email sent successfully to ${mailOptions.to} via Brevo.`);

    } catch (error) {
        console.error(`❌ Error sending email to ${mailOptions.to} via Brevo:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = { sendEmail };