const ValidationError = require('./ValidationError');

class VoteCandidateValidationError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'VoteCandidateValidationError';
  }
}

module.exports = VoteCandidateValidationError;
