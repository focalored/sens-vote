const DomainError = require('./DomainError');

class LogicConflictError extends DomainError {
  constructor(message) {
    super(message);
    this.name = 'LogicConflictError';
  }
}

module.exports = LogicConflictError;
