const BaseStrategy = require("./BaseStrategy");

class CallbackStrategy extends BaseStrategy {
  // candidates are hardcoded from people to options. but not used here either. remove?
  getResult(
    votes,
    { candidates, voterCount, roundNumber }
  ) {
    if (votes.length !== 4) {
      const err = new Error('Invalid vote data - must have four options');
      err.name = 'InvalidVotesDataError';
      throw err;
    }

    // Check if total votes === voterCount? since votes include abstains.

    const definiteVotes = votes.find((v) => v.candidateId === 'Definite callback');
    const maybeVotes = votes.find((v) => v.candidateId === 'Maybe callback');

    if (!definiteVotes || !maybeVotes) {
      const err = new Error('Votes missing for definite and maybe callback');
      err.name = 'VoteCandidateMismatchError';
      throw err;
    }

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
