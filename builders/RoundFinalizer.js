const validateVotesAgainstCandidates = require('../validators/validateVotesAgainstCandidates');
const { ValidationError } = require('../errors');

class RoundFinalizer {
  constructor({ strategy, currentRound, previousRound, voterCount }) {
    if (!strategy || !currentRound || !voterCount) {
      throw new ValidationError("Round Finalizer: Missing required parameters");
    }

    this.strategy = strategy;
    this.currentRound = currentRound;
    this.previousRound = previousRound;
    this.voterCount = voterCount;
  }

  finalizeRound(votes) {
    if (!Array.isArray(votes) || votes.length === 0) {
      throw new ValidationError('Round Finalizer: Votes must be a non-empty array');
    }

    const { result, warnings } = this.strategy.getResult(votes, {
      voterCount: this.voterCount,
      roundNumber: this.currentRound.roundNumber,
      previousRound: this.previousRound,
      evalMode: this.currentRound.evalMode,
    });

    if (warnings.length > 0) {
      console.warn('Strategy warnings:', warnings);
    }

    return {
      ...this.currentRound,
      votes: votes,
      result,
    };
  }
}

module.exports = RoundFinalizer;
