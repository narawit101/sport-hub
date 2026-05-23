const { BrevoClient } = require("@getbrevo/brevo");
require("dotenv").config();

/**
 * Brevo (Sendinblue) Transactional Email via HTTP API
 *
 * Uses HTTP API instead of SMTP so it works on hosts that block
 * outbound SMTP ports (e.g. Render free tier).
 *
 * Required env vars:
 *   BREVO_API_KEY  - Brevo API key (from https://app.brevo.com/settings/keys/api)
 *   SENDER_EMAIL   - From address (must be verified in Brevo)
 *   SENDER_NAME    - (optional) Display name for sender
 */
const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

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
 * Send an email via Brevo HTTP API with automatic retry
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Brevo send result
 */
async function sendEmail({ to, subject, html }) {
  const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;
  const senderName = process.env.SENDER_NAME || "Sport Hub";
  let lastErr;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Email] Retry attempt ${attempt}/${MAX_RETRIES - 1} for ${to}`);
        await delay(attempt);
      }

      const data = await brevo.transactionalEmails.sendTransacEmail({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      });

      console.log("[Email] Sent to:", to, "messageId:", data.messageId);
      return data;
    } catch (err) {
      lastErr = err;
      const errMsg = err?.body?.message || err?.message || String(err);
      console.error(
        `[Email] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        errMsg
      );

      // Only retry on transient / network errors (5xx, timeout, network)
      const isRetryable =
        err?.statusCode >= 500 ||
        err?.code === "ETIMEDOUT" ||
        err?.code === "ECONNRESET" ||
        err?.code === "ECONNREFUSED" ||
        err?.code === "ENOTFOUND";

      if (!isRetryable) {
        break; // non-retryable (e.g. 400 bad request, 401 auth) → bail
      }
    }
  }

  // All retries exhausted
  const finalMsg = lastErr?.body?.message || lastErr?.message || String(lastErr);
  console.error("[Email] Failed to send after all retries:", finalMsg);

  if (process.env.NODE_ENV === "development") {
    console.log("\n=================== [DEVELOPMENT EMAIL LOG] ===================");
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("------------------------------------------------------------------");
    const otpMatch = html.match(/>(\\d{6})</) || html.match(/\\b(\\d{6})\\b/);
    if (otpMatch) {
      console.log(`OTP Code found: ${otpMatch[1]}`);
    }
    console.log("Body excerpt:");
    console.log(html.replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim().substring(0, 300) + "...");
    console.log("==================================================================\n");
  }

  throw lastErr;
}

module.exports = { sendEmail };
