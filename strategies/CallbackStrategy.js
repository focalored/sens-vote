const BaseStrategy = require("./BaseStrategy");

class CallbackStrategy extends BaseStrategy {
  static expectedOptions = ['Definite callback', 'Maybe callback', 'No callback', 'Abstain'];
  
  getResult(
    votes,
    { voterCount, roundNumber }
  ) {
    const warnings = BaseStrategy.checkTotalVotes(votes, voterCount);

    const definiteVotes = votes.find((v) => v.candidateId === 'Definite callback');
    const maybeVotes = votes.find((v) => v.candidateId === 'Maybe callback');

    let result;

    if ((definiteVotes.count + maybeVotes.count) / voterCount < 0.4) {
      result = {
        type: 'callback',
        winners: { bucket: 'No callback' },
        isComplete: true,
      };

      return { result, warnings };
    }

    if (definiteVotes.count / voterCount >= 0.75) {
      result = {
        type: 'callback',
        winners: { bucket: 'Definite callback' },
        isComplete: true,
      };

      return { result, warnings };
    }

    result = {
      type: 'callback',
      winners: { bucket: 'Possible callback' },
      isComplete: Boolean(roundNumber === 2),
    }

    return { result, warnings };
  }
}

module.exports = CallbackStrategy;
