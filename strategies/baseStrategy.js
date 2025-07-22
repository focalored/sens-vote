class BaseStrategy {
  static checkTotalVotes(votes, voterCount) {
    const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
    const warnings = [];

    if (totalVotes > voterCount) {
      warnings.push(`Total votes (${totalVotes}) exceed voter count (${voterCount})`);
    }

    return warnings;
  }

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
