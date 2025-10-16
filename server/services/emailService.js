// server/services/emailService.js

const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize Brevo (SendinBlue) API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (mailOptions) => {
  console.log("--- FINAL DEBUG CHECK ---");
  console.log("Using Sender Email:", process.env.EMAIL_USER);
  const key = process.env.BREVO_API_KEY;
  console.log("Using API Key (first 10 chars):", key ? key.substring(0, 10) + '...' : 'API Key is UNDEFINED');

  try {
    // Create email object
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    // Sender info
    sendSmtpEmail.sender = {
      name: "TravelEase",
      email: process.env.EMAIL_USER,
    };

    // Recipient(s)
    sendSmtpEmail.to = [{ email: mailOptions.to }];

    // Subject & content
    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.htmlContent = mailOptions.htmlContent;

    // Optional: Attachments
    if (mailOptions.attachments) {
      sendSmtpEmail.attachment = mailOptions.attachments;
    }

    // Send the email
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${mailOptions.to} via Brevo.`);
  } catch (error) {
    console.error(`❌ Error sending email to ${mailOptions.to}:`, error.response?.body || error);
    throw new Error('Failed to send email.');
  }
};

module.exports = { sendEmail };
