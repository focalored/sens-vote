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
