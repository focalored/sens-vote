const BaseStrategy = require("./BaseStrategy");

class ExecStrategy extends BaseStrategy {
  getResult(
    votes,
    { candidates, voterCount, roundNumber },
  ) {
    this._validateVotesAgainstCandidates(votes, candidates);

    const sortedVotes = this._getSortedVotes(votes.filter((v) => v.candidateId !== 'No confidence'));

    const [first, second, ...rest] = sortedVotes;
    
    // roundNumber === 1
    if (first.count / voterCount >= 0.75) {
      return {
        winners: { role: first.candidateId },
        isComplete: true,
      };
    }

    if (roundNumber === 2) {
      if (first.count / voterCount >= 0.5 && (!second || first.count >= second.count + 2)) {
        return {
          winners: { role: first.candidateId },
          isComplete: true,
        };
      }
    }

    if (roundNumber === 3) {
      if (first.count / voterCount >= 0.5) {
        return {
          winners: { role: first.candidateId },
          isComplete: true,
        };
      }
    }

    return {
      winners: { role: null },
      isComplete: Boolean(roundNumber === 3),
    }
  }
}

module.exports = ExecStrategy;
