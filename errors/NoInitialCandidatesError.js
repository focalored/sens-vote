const DomainError = require('./DomainError');

class NoInitialCandidatesError extends DomainError {
  constructor(message = 'First round must have manually provided candidates') {
    super(message);
    this.name = 'NoInitialCandidatesError';
  }
}

module.exports = NoInitialCandidatesError;
