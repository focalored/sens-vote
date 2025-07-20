class BaseStrategy {
  _getSortedVotes(aggregateVotes) {
    return aggregateVotes.sort((a, b) => b.count - a.count);
  }

  determineMode(previousRound) {
    return "full";
  }

  suggestNextCandidates(previousRound, evalMode) {
    throw new Error("This function should never be called for this strategy");
  }

  getResult(votes, context) {
    throw new Error("Not implemented");
  }
}

module.exports = BaseStrategy;
