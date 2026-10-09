const { AppError } = require('../utils/errors');

/** validate(schema, 'body' | 'query' | 'params') -> parsed data lands in req.valid[source] */
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new AppError(400, details[0]?.message || 'Validation failed', 'VALIDATION_ERROR', details));
  }
  req.valid = req.valid || {};
  req.valid[source] = result.data;
  next();
};
