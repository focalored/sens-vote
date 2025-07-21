const BaseStrategy = require("./BaseStrategy");

class SoloStrategy extends BaseStrategy {
  determineMode(previousRound) {
    if (!previousRound) return "full";

    const { soloist, understudy } = previousRound.result.winners;
    return soloist && !understudy ? "understudy_only" : "full";
  }

  suggestCandidates(previousRound, evalMode) {
    const { votes } = previousRound;

    if (evalMode === "understudy_only") {
      const soloist = previousRound.result.winners.soloist;

      const nonSoloistVotes = votes.filter(
        (vote) => vote.candidateId !== soloist
      );
      if (nonSoloistVotes.length === 0) {
        const err = new Error('No non-soloist candidates found for understudy round');
        err.name = 'NoUnderstudyCandidatesError';
        throw err;
      }

      const topScore = Math.max(...nonSoloistVotes.map((v) => v.count || 0));

      return nonSoloistVotes
        .filter((vote) => vote.count === topScore)
        .map((vote) => vote.candidateId);
    }

    const topScore = Math.max(...votes.map((v) => v.count || 0));

    return votes
      .filter((vote) => topScore - vote.count < 2)
      .map((vote) => vote.candidateId);
  }

  getResult(
    votes,
    { candidates, voterCount, roundNumber, previousRound, evalMode },
  ) {
    this._validateVotesAgainstCandidates(votes, candidates);

    const sortedVotes = this._getSortedVotes(votes);

    const [first, second, ...rest] = sortedVotes;

    // Understudy-only logic
    if (evalMode === "understudy_only") {
      const soloist = previousRound?.result?.winners?.soloist;

      if (!soloist) {
        const err = new Error('Missing soloist in previous round for understudy_only mode');
        err.name = 'MissingSoloistError';
        throw err;
      }

      const understudy = first.count > second.count ? first.candidateId : null;

      return {
        winners: { soloist, understudy },
        isComplete: Boolean(understudy),
      };
    }

    // Full evaluation logic
    // If only 1 candidate, rule is 50% majority
    if (first && !second) {
      const soloist = (first.count / voterCount) >= 0.5 ? first.candidateId : null;
      const understudy = null;

      return {
        winners: { soloist, understudy },
        isComplete: Boolean(soloist),
      };
    }

    const isThresholdMet =
      roundNumber < 4 ? first.count > second.count + 1 : first.count > second.count;

    const soloist = isThresholdMet ? first.candidateId : null;
    const understudy =
      soloist && (!rest || second.count > rest[0].count) ? second.candidateId : null;

    return {
      winners: { soloist, understudy },
      isComplete: Boolean(soloist && understudy),
    };
  }
}

module.exports = SoloStrategy;
