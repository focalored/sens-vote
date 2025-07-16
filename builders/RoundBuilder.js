class RoundBuilder {
  constructor(strategies, session, providedCandidates, votes) {
    this.strategy = strategies[session.type];
    this.voterCount = session.configuration.voterCount;
    this.previousRounds = session.rounds;
    this.initialCandidates = session.initialCandidates;
    this.providedCandidates = providedCandidates;
    this.votes = votes;
  }

  _getEvalMode(previousRound) {
    return this.strategy.determineMode(previousRound);
  }

  _getCandidates(previousRound, evalMode) {
    if (this.providedCandidates) return this.providedCandidates;
    if (this.previousRounds.length === 0) return this.initialCandidates;
    return this.strategy.suggestNextCandidates(previousRound, evalMode);
  }

  /**
   * Builds data for the next round of voting based on previous rounds and current votes.
   * 
   * Steps:
   * - Fetches prior round data.
   * - Finalizes next round's candidates.
   * - For solo auditions: determines whether the next round is an understudy tiebreaker via evalMode.
   * - Delegates winner calculation to strategy.
   * - Prepares and returns the round object to be stored in database.
   *
   * @returns {Object} Round data.
   */
  build() {
    const previousRound = this.previousRounds.at(-1);
    const evalMode = this._getEvalMode(previousRound);
    const candidates = this._getCandidates(previousRound, evalMode);
    const roundNumber = this.previousRounds.length + 1;

    const result = this.strategy.getResult(this.votes, {
      candidates,
      voterCount: this.voterCount,
      roundNumber,
      previousRound,
      evalMode,
    });

    return { roundNumber, evalMode, candidates, votes: this.votes, result };
  }
}

module.exports = RoundBuilder;
