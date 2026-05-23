const rateLimit = require("express-rate-limit");
const { DateTime } = require("luxon");

/**
 * Create a reusable rate limiter middleware
 * @param {Object} options
 * @param {number} [options.windowMs=600000] - Time window in ms (default 10 min)
 * @param {number} [options.max=100] - Max requests per window
 * @param {Function} [options.keyGenerator] - Function to determine rate limit key (defaults to req.ip)
 * @param {string} [options.message] - Custom message on rate limit hit
 * @returns {Function} Express rate limit middleware
 */
function createRateLimiter({
  windowMs = 10 * 60 * 1000,
  max = 100,
  keyGenerator = (req) => req.ip,
  message = "คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
} = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res, next, options) => {
      console.warn("[RateLimit]", {
        ip: req.ip,
        path: req.originalUrl,
        time: DateTime.now()
          .setZone("Asia/Bangkok")
          .toFormat("dd/MM/yyyy HH:mm:ss"),
      });
      res
        .status(options.statusCode)
        .json({ message });
    },
  });
}

module.exports = { createRateLimiter };
