const BaseStrategy = require("./BaseStrategy");

class CallbackStrategy extends BaseStrategy {
  // candidates are hardcoded from people to options. but not used here either. remove?
  getResult(
    votes,
    { candidates, voterCount, roundNumber }
  ) {
    this._validateVotesAgainstCandidates(votes, candidates, [
      'Definite callback',
      'Maybe callback',
      'No callback',
      'Abstain',
    ]);

    const definiteVotes = votes.find((v) => v.candidateId === 'Definite callback');
    const maybeVotes = votes.find((v) => v.candidateId === 'Maybe callback');

    if ((definiteVotes.count + maybeVotes.count) / voterCount < 0.4) {
      return {
        winners: { bucket: 'No callback' },
        isComplete: true,
      };
    }

    if (definiteVotes.count / voterCount >= 0.75) {
      return {
        winners: { bucket: 'Definite callback' },
        isComplete: true,
      };
    }

    return {
      winners: { bucket: 'Possible callback' },
      isComplete: Boolean(roundNumber === 2),
    }
  }
}

module.exports = CallbackStrategy;
