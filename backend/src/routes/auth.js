const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const config = require('../config');
const db = require('../db');
const logger = require('../logger');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit');
const { registerSchema, loginSchema } = require('../validators');
const { AppError, asyncHandler } = require('../utils/errors');

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('timing-attack-protection', BCRYPT_ROUNDS);

const signToken = (userId) =>
  jwt.sign({}, config.jwtSecret, { subject: userId, jwtid: randomUUID(), expiresIn: config.jwtExpiresIn, algorithm: 'HS256' });

// POST /api/auth/register
router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.valid.body;
  const exists = await db.query('SELECT 1 FROM users WHERE lower(email) = $1', [email]);
  if (exists.rowCount) throw new AppError(409, 'An account with this email already exists', 'EMAIL_TAKEN');

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await db.query(
    `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, full_name AS "fullName", email, created_at AS "createdAt"`,
    [fullName, email, hash]
  );
  logger.info('user registered', { userId: rows[0].id });
  res.status(201).json({ user: rows[0], token: signToken(rows[0].id) });
}));

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.valid.body;
  const { rows } = await db.query(
    'SELECT id, full_name AS "fullName", email, created_at AS "createdAt", password_hash FROM users WHERE lower(email) = $1',
    [email]
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH); // constant-ish time
  if (!user || !ok) {
    logger.warn('failed login', { ip: req.ip });
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  delete user.password_hash; // never expose hashes
  res.json({ user, token: signToken(user.id) });
}));

// POST /api/auth/logout  - revokes the token server-side
router.post('/logout', auth, asyncHandler(async (req, res) => {
  await db.query(
    'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT DO NOTHING',
    [req.token.jti, req.token.exp]
  );
  await db.query('DELETE FROM revoked_tokens WHERE expires_at < now()'); // housekeeping
  res.json({ message: 'Logged out successfully' });
}));

// GET /api/auth/me
router.get('/me', auth, (req, res) => res.json({ user: req.user }));

module.exports = router;
