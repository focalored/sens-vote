class StrategyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StrategyError';
  }
}

module.exports = StrategyError;
