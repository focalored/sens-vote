class RoundInitializer {
  constructor({ sessionId, strategy, rounds, providedCandidates }) {
    if (!sessionId || !Array.isArray(rounds) || !strategy) {
      throw new Error("Round Initializer: Missing required parameters");
    }

    if (providedCandidates && !Array.isArray(providedCandidates)) {
      throw new Error("Invalid providedCandidates: must be an array");
    }

    this.sessionId = sessionId;
    this.rounds = rounds;
    this.strategy = strategy;
    this.providedCandidates = providedCandidates || null;
  }

  #getCandidates(evalMode) {
    if (this.providedCandidates) return this.providedCandidates;

    return this.strategy.suggestCandidates(this.rounds.at(-1), evalMode);
  }

  initializeRound() {
    const roundNumber = this.rounds.length + 1;
    const evalMode = this.strategy.determineMode(this.rounds.at(-1));
    const candidates = this.#getCandidates(evalMode);

    if (!Array.isArray(candidates)) {
      throw new Error("Round Initializer: No candidates provided or generated");
    }

    return {
      sessionId: this.sessionId,
      roundNumber,
      candidates,
      evalMode,
    };
  }
}

module.exports = RoundInitializer;
