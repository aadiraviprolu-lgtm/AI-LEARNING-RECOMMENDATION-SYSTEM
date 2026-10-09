const logger = require('../logger');
const { AppError } = require('../utils/errors');

const notFound = (req, res, next) => next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { status = 500, code = 'INTERNAL_ERROR', message, details } = err;

  if (err.type === 'entity.parse.failed') { status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body'; }
  else if (err.type === 'entity.too.large') { status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body too large'; }
  else if (err.code === '22P02') { status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid identifier'; }
  else if (err.code === '23505') { status = 409; code = 'CONFLICT'; message = 'Resource already exists'; }
  else if (err.code === '23503') { status = 400; code = 'INVALID_REFERENCE'; message = 'Referenced resource does not exist'; }
  else if (err.message === 'CORS_NOT_ALLOWED') { status = 403; code = 'CORS_NOT_ALLOWED'; message = 'Origin not allowed'; }
  else if (!(err instanceof AppError)) { status = 500; code = 'INTERNAL_ERROR'; }

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.originalUrl });
    message = 'Something went wrong on our side. Please try again.'; // never leak internals
    details = undefined;
  }
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
};

module.exports = { notFound, errorHandler };
