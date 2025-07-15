class BaseStrategy {
  _getSortedVotes(candidates, votes) {
    const voteMap = {};

    if (candidates.length !== votes.length) {
      console.log(candidates, votes);
      throw new Error("Candidates list and votes don't match");
    }

    for (let i = 0; i < candidates.length; i++) {
      voteMap[candidates[i]] = votes[i] || 0;
    };

    return Object.entries(voteMap).sort((a, b) => b[1] - a[1]);
  }

  getResult(votes, context) {
    throw new Error("Not implemented");
  }

  suggestNextCandidates(previousRound, evalMode) {
    throw new Error("Not implemented");
  }
  
  determineMode(previousRounds) {
    return "full";
  }
}

module.exports = BaseStrategy;
