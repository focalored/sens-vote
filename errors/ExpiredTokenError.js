const AuthError = require('./AuthError');

class ExpiredTokenError extends AuthError {
  constructor(message) {
    super(message);
    this.name = 'ExpiredTokenError';
  }
}

module.exports = ExpiredTokenError;
