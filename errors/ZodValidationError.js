const ValidationError = require('./ValidationError');

class ZodValidationError extends ValidationError {
  constructor(zodError) {
    super('Invalid request body');
    this.name = 'ZodValidationError';
    this.errors = zodError.errors;
  }
}

module.exports = ZodValidationError;
