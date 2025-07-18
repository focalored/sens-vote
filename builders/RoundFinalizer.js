const { aggregateVotesFromBallots } = require("../utils/aggregateVotes");

class RoundFinalizer {
  constructor({ strategy, currentRound, previousRound = null, voterCount }) {
    if (!strategy | !currentRound | !voterCount ) {
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

  finalizeRound({ votes = null, ballots = null }) {
    const aggregateVotes = votes || aggregateVotesFromBallots(ballots);

    const result = this.strategy.getResult(aggregateVotes, {
      candidates: this.currentRound.candidates,
      voterCount: this.voterCount,
      roundNumber: this.currentRound.roundNumber,
      previousRound: this.previousRound,
      evalMode: this.currentRound.evalMode
    });

    return {
      ...this.currentRound,
      votes: aggregateVotes,
      result
    };
  }
}

module.exports = RoundFinalizer;
