class BaseStrategy {
  _getSortedVotes(aggregateVotes) {
    return aggregateVotes.sort((a, b) => b.count - a.count);
  }

  determineMode(previousRound) {
    return "full";
  }

  suggestNextCandidates(previousRound, evalMode) {
    throw new Error("Not implemented");
  }

  getResult(votes, context) {
    throw new Error("Not implemented");
  }
}

module.exports = BaseStrategy;
