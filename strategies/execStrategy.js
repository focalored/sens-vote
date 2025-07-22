const BaseStrategy = require("./BaseStrategy");

class ExecStrategy extends BaseStrategy {
  getResult(
    votes,
    { voterCount, roundNumber },
  ) {
    const warnings = BaseStrategy.checkTotalVotes(votes, voterCount);

    const sortedVotes = this._getSortedVotes(votes.filter((v) => v.candidateId !== 'No confidence'));

    const [first, second, ...rest] = sortedVotes;

    let result;
    
    if (first.count / voterCount >= 0.75) {
      result = {
        type: 'exec',
        winners: { role: first.candidateId },
        isComplete: true,
      };

      return { result, warnings };
    }

    if (roundNumber === 2) {
      if (first.count / voterCount >= 0.5 && (!second || first.count >= second.count + 2)) {
        result = {
          type: 'exec',
          winners: { role: first.candidateId },
          isComplete: true,
        };

        return { result, warnings };
      }
    }

    if (roundNumber === 3) {
      if (first.count / voterCount >= 0.5) {
        result = {
          type: 'exec',
          winners: { role: first.candidateId },
          isComplete: true,
        };

        return { result, warnings };
      }
    }

    result = {
      type: 'exec',
      winners: { role: null },
      isComplete: Boolean(roundNumber === 3),
    };

    return { result, warnings };
  }
}

module.exports = ExecStrategy;
