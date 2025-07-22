const DomainError = require('./DomainError');

class InvalidStateTransitionError extends DomainError {
  constructor(currentState, action) {
    super(`Invalid state transition attempted from "${currentState}" via "${action}"`);
    this.name = 'InvalidStateTransitionError';
    this.currentState = currentState;
    this.action = action;
  }
}

module.exports = InvalidStateTransitionError;
