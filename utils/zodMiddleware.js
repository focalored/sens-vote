const ZodValidationError = require('../errors/ZodValidationError');

const zodMiddleware = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body);
    next();
  } catch (err) {
    next(new ZodValidationError(err));
  }
}

module.exports = zodMiddleware;
