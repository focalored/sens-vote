const AuthError = require('./AuthError');

class InvalidTokenError extends AuthError {
  constructor(message) {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

module.exports = InvalidTokenError;
