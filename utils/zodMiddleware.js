const { ZodError } = require('zod')
const ZodValidationError = require('../errors/ZodValidationError');

const zodMiddleware = ({ body, params, query }) => (req, res, next) => {
  try {
    if (body) req.validatedBody = body.parse(req.body);
    if (params) req.validatedParams = params.parse(req.params);
    if (query) req.validatedQuery = query.parse(req.query);
    
    next();
  } catch (err) {
    next(new ZodValidationError(err));
  }
}

module.exports = zodMiddleware;
