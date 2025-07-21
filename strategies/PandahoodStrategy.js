const BaseStrategy = require("./BaseStrategy");

class PandahoodStrategy extends BaseStrategy {
  static expectedOptions = ['Yes', 'No'];

  getResult(
    votes,
    { voterCount, roundNumber }
  ) {
    const affirmativeVotes = votes.find((v) => v.candidateId === 'Yes');
    if (affirmativeVotes.count / voterCount >= 0.8) {
      return {
      type: 'pandahood',
        winners: { bucket: 'Proposal passed' },
        isComplete: true,
      };
    }

    return {
      type: 'pandahood',
      winners: { bucket: 'Proposal struck' },
      isComplete: Boolean(roundNumber === 2),
    };
  }
}

module.exports = PandahoodStrategy;
