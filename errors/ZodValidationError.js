const ValidationError = require('./ValidationError');

class ZodValidationError extends ValidationError {
  constructor(zodError) {
    super('Invalid request input');
    this.name = 'ZodValidationError';
    this.original = zodError;
    this.errors = this._flattenErrors(zodError.issues);
  }

  _flattenErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) return [];

    return errors.map(err => {
      return {
        code: err.code,
        path: err.path.join('.'),
        message: err.message,
      };
    });
  }
}

module.exports = ZodValidationError;
