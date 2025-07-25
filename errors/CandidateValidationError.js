const ValidationError = require('./ValidationError');

class CandidateValidationError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'CandidateValidationError';
  }
}

module.exports = CandidateValidationError;
