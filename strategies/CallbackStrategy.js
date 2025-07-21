const BaseStrategy = require("./BaseStrategy");

class CallbackStrategy extends BaseStrategy {
  static expectedOptions = ['Definite callback', 'Maybe callback', 'No callback', 'Abstain'];
  
  getResult(
    votes,
    { voterCount, roundNumber }
  ) {

    const definiteVotes = votes.find((v) => v.candidateId === 'Definite callback');
    const maybeVotes = votes.find((v) => v.candidateId === 'Maybe callback');

    if ((definiteVotes.count + maybeVotes.count) / voterCount < 0.4) {
      return {
        type: 'callback',
        winners: { bucket: 'No callback' },
        isComplete: true,
      };
    }

    if (definiteVotes.count / voterCount >= 0.75) {
      return {
        type: 'callback',
        winners: { bucket: 'Definite callback' },
        isComplete: true,
      };
    }

    return {
      type: 'callback',
      winners: { bucket: 'Possible callback' },
      isComplete: Boolean(roundNumber === 2),
    }
  }
}

module.exports = CallbackStrategy;
