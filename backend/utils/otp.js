const crypto = require("crypto");

/**
 * Generate a numeric OTP of specified length
 * @param {number} length - OTP length (default 6)
 * @returns {string} OTP string
 */
function generateNumericOtp(length = 6) {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

module.exports = { generateNumericOtp };
