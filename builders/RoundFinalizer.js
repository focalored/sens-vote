const validateVotesAgainstCandidates = require('../validators/validateVotesAgainstCandidates');

class RoundFinalizer {
  constructor({ strategy, currentRound, previousRound = null, voterCount }) {
    if (!strategy || !currentRound || !voterCount) {
      throw new Error("Round Finalizer: Missing required parameters");
    }

    // Should current and previous rounds be assigned in service?
    // possibly passing null as previousRound to RoundFinalizer, in case current round is 1st
    // Or should service just feed rounds array and let RoundFinalizer find out
    this.strategy = strategy;
    this.currentRound = currentRound;
    this.previousRound = previousRound;
    this.voterCount = voterCount;
  }

  finalizeRound(votes) {
    const expectedOptions = this.strategy.constructor.expectedOptions || null;
    validateVotesAgainstCandidates(votes, this.currentRound.candidates, expectedOptions)

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
