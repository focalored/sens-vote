const AuthError = require('./AuthError');

class MissingTokenError extends AuthError {
  constructor(message) {
    super(message);
    this.name = 'MissingTokenError';
  }
}

module.exports = MissingTokenError;
