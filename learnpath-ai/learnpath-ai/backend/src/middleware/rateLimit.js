const rateLimit = require('express-rate-limit');

const tooMany = (message) => ({ error: { code: 'RATE_LIMITED', message } });

// Brute-force protection: failed login attempts only (successful ones are not counted).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  message: tooMany('Too many login attempts. Please try again in 15 minutes.'),
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: tooMany('Too many sign-ups from this IP. Please try again later.'),
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false,
  message: tooMany('Too many requests. Please slow down.'),
});

module.exports = { loginLimiter, registerLimiter, apiLimiter };
