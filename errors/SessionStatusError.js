const DomainError = require('./DomainError');

class SessionStatusError extends DomainError {
  constructor(message) {
    super(message);
    this.name = 'SessionStatusError';
  }
}

module.exports = SessionStatusError;
