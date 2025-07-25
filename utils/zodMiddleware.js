const { ZodError } = require('zod')
const ZodValidationError = require('../errors/ZodValidationError');

const zodMiddleware = ({ body, params }) => (req, res, next) => {
  try {
    if (body) req.validatedBody = body.parse(req.body);
    if (params) req.validatedParams = params.parse(req.params);
    
    next();
  } catch (err) {
    next(new ZodValidationError(err));
  }
}

module.exports = zodMiddleware;
