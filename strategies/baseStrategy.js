class BaseStrategy {
  _getSortedVotes(aggregateVotes) {
    return [...aggregateVotes].sort((a, b) => b.count - a.count);
  }

  determineMode() {
    return "full";
  }

  suggestNextCandidates(previousRound) {
    return previousRound.candidates;
  }

  getResult() {
    throw new Error("Not implemented");
  }
}

module.exports = BaseStrategy;
