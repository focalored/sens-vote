class VoteCandidateValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VoteCandidateValidationError';
  }
}

module.exports = VoteCandidateValidationError;
