const StrategyError = require('./StrategyError');

class LogicConflictError extends StrategyError {
  constructor(message) {
    super(message);
    this.name = 'LogicConflictError';
  }
}

module.exports = LogicConflictError;
