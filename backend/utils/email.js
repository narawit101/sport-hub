const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Nodemailer transporter (Gmail SMTP)
 * 
 * Required env vars:
 *   SMTP_USER     - Gmail address (e.g. yourname@gmail.com)
 *   SMTP_PASS     - Gmail App Password (16-char)
 *   SENDER_EMAIL  - From address shown in emails (defaults to SMTP_USER)
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Nodemailer send result
 */
async function sendEmail({ to, subject, html }) {
  const from = process.env.SENDER_EMAIL || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({ from, to, subject, html });
    console.log("[Email] Sent to:", to, "messageId:", info.messageId);
    return info;
  } catch (err) {
    console.error("[Email] Failed to send:", err.message);
    
    if (process.env.NODE_ENV === "development") {
      console.log("\n=================== [DEVELOPMENT EMAIL LOG] ===================");
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("------------------------------------------------------------------");
      const otpMatch = html.match(/>(\d{6})</) || html.match(/\b(\d{6})\b/);
      if (otpMatch) {
        console.log(`OTP Code found: ${otpMatch[1]}`);
      }
      console.log("Body excerpt:");
      console.log(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 300) + "...");
      console.log("==================================================================\n");
    }
    
    throw err;
  }
}

module.exports = { sendEmail };
