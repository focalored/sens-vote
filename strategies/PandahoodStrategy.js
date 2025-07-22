const BaseStrategy = require("./BaseStrategy");

class PandahoodStrategy extends BaseStrategy {
  static expectedOptions = ['Yes', 'No'];

  getResult(
    votes,
    { voterCount, roundNumber }
  ) {
    const warnings = BaseStrategy.checkTotalVotes(votes, voterCount);

    let result;

    const affirmativeVotes = votes.find((v) => v.candidateId === 'Yes');
    if (affirmativeVotes.count / voterCount >= 0.8) {
      result = {
      type: 'pandahood',
        winners: { bucket: 'Proposal passed' },
        isComplete: true,
      };

      return { result, warnings };
    }

    result = {
      type: 'pandahood',
      winners: { bucket: 'Proposal struck' },
      isComplete: Boolean(roundNumber === 2),
    };

    return { result, warnings };
  }
}

module.exports = PandahoodStrategy;
