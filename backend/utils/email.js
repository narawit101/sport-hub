const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Nodemailer transporter (Gmail SMTP)
 *
 * Uses explicit SMTP settings with port 587 + STARTTLS instead of
 * `service: "gmail"` (which defaults to port 465/SSL) for better
 * compatibility with cloud providers that may block port 465.
 *
 * Required env vars:
 *   SMTP_USER     - Gmail address (e.g. yourname@gmail.com)
 *   SMTP_PASS     - Gmail App Password (16-char)
 *   SENDER_EMAIL  - From address shown in emails (defaults to SMTP_USER)
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS (not direct SSL on port 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, // reuse connections
  maxConnections: 3,
  maxMessages: 50,
  connectionTimeout: 30000, // 30 s connection timeout
  greetingTimeout: 30000, // 30 s greeting timeout
  socketTimeout: 60000, // 60 s socket timeout
});

/** Retry config */
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 s, doubles each retry

/**
 * Delay helper (exponential back-off with jitter)
 */
function delay(attempt) {
  const ms = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send an email with automatic retry on transient errors
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Nodemailer send result
 */
async function sendEmail({ to, subject, html }) {
  const from = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Email] Retry attempt ${attempt}/${MAX_RETRIES - 1} for ${to}`);
        await delay(attempt);
      }

      const info = await transporter.sendMail({ from, to, subject, html });
      console.log("[Email] Sent to:", to, "messageId:", info.messageId);
      return info;
    } catch (err) {
      lastErr = err;
      console.error(
        `[Email] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        err.code || err.message
      );

      // Only retry on transient / network errors
      const retryableCodes = ["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ECONNRESET", "ECONNREFUSED"];
      if (!retryableCodes.includes(err.code)) {
        break; // non-retryable (e.g. auth error) → bail immediately
      }
    }
  }

  // All retries exhausted — log dev info & throw
  console.error("[Email] Failed to send after all retries:", lastErr.message);

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

  throw lastErr;
}

module.exports = { sendEmail };
