const guardState = (session, expected) => {
  if (session.status !== expected) {
    const err = `Invalid session status. Expected by service: ${expected}, but got: ${session.status}`;
    err.name = 'SessionStatusError';
    throw err;
  }
};

module.exports = guardState;
