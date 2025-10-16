// server/services/emailService.js

const Brevo = require('@getbrevo/brevo');

// Configure the API key
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new Brevo.TransactionalEmailsApi();

const sendEmail = async (mailOptions) => {
  console.log("--- FINAL DEBUG CHECK ---");
  console.log("Using Sender Email:", process.env.EMAIL_USER);
  const key = process.env.BREVO_API_KEY;
  console.log("Using API Key (first 10 chars):", key ? key.substring(0, 10) + '...' : 'API Key is UNDEFINED');

  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "TravelEase",
      email: process.env.EMAIL_USER,
    };

    sendSmtpEmail.to = [{ email: mailOptions.to }];
    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.htmlContent = mailOptions.htmlContent;

    if (mailOptions.attachments) {
      sendSmtpEmail.attachment = mailOptions.attachments;
    }

    await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${mailOptions.to} via Brevo.`);
  } catch (error) {
    console.error(`❌ Error sending email to ${mailOptions.to}:`, error.response?.body || error);
    throw new Error('Failed to send email.');
  }
};

module.exports = { sendEmail };
