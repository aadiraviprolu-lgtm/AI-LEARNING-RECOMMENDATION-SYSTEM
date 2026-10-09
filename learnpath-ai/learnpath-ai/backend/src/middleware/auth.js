const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { AppError, asyncHandler } = require('../utils/errors');

module.exports = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw new AppError(401, 'Invalid authentication token', 'TOKEN_INVALID');
  }

  const revoked = await db.query('SELECT 1 FROM revoked_tokens WHERE jti = $1', [payload.jti]);
  if (revoked.rowCount) throw new AppError(401, 'You have been logged out. Please log in again.', 'TOKEN_REVOKED');

  const { rows } = await db.query(
    'SELECT id, full_name AS "fullName", email, created_at AS "createdAt" FROM users WHERE id = $1',
    [payload.sub]
  );
  if (!rows.length) throw new AppError(401, 'Account no longer exists', 'TOKEN_INVALID');

  req.user = rows[0];
  req.token = payload;
  next();
});
