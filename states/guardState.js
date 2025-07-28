const { SessionStatusError } = require('../errors');

const guardState = (session, expected) => {
  if (session.status !== expected) {
    throw new SessionStatusError(`Invalid session status. Expected by service: ${expected}, but got: ${session.status}`);
  }
};

module.exports = guardState;
