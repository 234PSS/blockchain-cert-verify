const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  const errors = [];

  const runChecks = (source, rules, label) => {
    if (!rules) return;
    for (const [field, checks] of Object.entries(rules)) {
      const value = source[field];
      for (const check of checks) {
        const message = check(value, source);
        if (message) {
          errors.push({ field: `${label}.${field}`, message });
        }
      }
    }
  };

  runChecks(req.body, schema.body, 'body');
  runChecks(req.params, schema.params, 'params');
  runChecks(req.query, schema.query, 'query');

  if (errors.length) {
    return next(new AppError('Validation failed', 400, errors));
  }
  next();
};

module.exports = validate;
