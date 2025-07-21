const BaseStrategy = require("./BaseStrategy");

class PandahoodStrategy extends BaseStrategy {
  getResult(
    votes,
    { candidates, voterCount, roundNumber }
  ) {
    this._validateVotesAgainstCandidates(votes, candidates, [
      'Yes',
      'No',
    ]);

    const affirmativeVotes = votes.find((v) => v.candidateId === 'Yes');
    if (affirmativeVotes.count / voterCount >= 0.8) {
      return {
        winners: { bucket: 'Proposal passed' },
        isComplete: true,
      };
    }

    return {
      winners: { bucket: 'Proposal struck' },
      isComplete: Boolean(roundNumber === 2),
    };
  }
}

module.exports = PandahoodStrategy;
