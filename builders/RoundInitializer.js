const { ValidationError } = require('../errors');

class RoundInitializer {
  constructor({ sessionId, strategy, rounds, providedCandidates, candidateType }) {
    if (!sessionId || !strategy || !Array.isArray(rounds) || !candidateType ) {
      throw new ValidationError('Round Initializer: Missing required parameters');
    }

    if (Array.isArray(providedCandidates) && providedCandidates.length === 0) {
      throw new ValidationError('Round Initializer: Provided candidates array must be non-empty');
    }

    this.sessionId = sessionId;
    this.rounds = rounds;
    this.strategy = strategy;
    this.providedCandidates = providedCandidates;
    this.candidateType = candidateType;
  }

  #getCandidates(evalMode) {
    if (this.providedCandidates) return this.providedCandidates;

    return this.strategy.suggestCandidates(this.rounds.at(-1), evalMode);
  }

  initializeRound() {
    const roundNumber = this.rounds.length + 1;
    const evalMode = this.strategy.determineMode(this.rounds.at(-1));
    const candidates = this.#getCandidates(evalMode);

    return {
      sessionId: this.sessionId,
      roundNumber,
      candidates,
      metadata: { candidateType: this.candidateType },
      evalMode,
    };
  }
}

module.exports = RoundInitializer;
