const VoteCandidateValidationError = require('../errors/VoteCandidateValidationError')

class BaseStrategy {
  _getSortedVotes(aggregateVotes) {
    return [...aggregateVotes].sort((a, b) => b.count - a.count);
  }

  _validateVotesAgainstCandidates(votes, candidates, expectedOptions = null) {
    const candidateIds = new Set(candidates);
    const voteIds = new Set(votes.map((v) => v.candidateId));

    if (candidateIds.size !== candidates.length) {
      throw new VoteCandidateValidationError('Duplicate candidates found');
    }

    if (voteIds.size !== votes.length) {
      throw new VoteCandidateValidationError('Duplicate votes found');
    }

    if (expectedOptions) {
      for (const option of expectedOptions) {
        if (!candidateIds.has(option) || !voteIds.has(option)) {
          throw new VoteCandidateValidationError(`Missing option "${option}" in candidates or votes`);
        }
      }

      if (candidateIds.size > expectedOptions.length) {
        throw new VoteCandidateValidationError('Unexpected option found in candidates');
      }

      if (voteIds.size > expectedOptions.length) {
        throw new VoteCandidateValidationError('Unexpected option found in votes');
      }
    }

    if (candidateIds.size !== voteIds.size) {
      throw new VoteCandidateValidationError('Votes and candidates differ in count');
    }

    for (const id of voteIds) {
      if (!candidateIds.has(id)) {
        throw new VoteCandidateValidationError(`Vote option "${id}" not in declared candidates`);
      }
    }
  }

  determineMode(previousRound) {
    return "full";
  }

  suggestNextCandidates(previousRound, evalMode) {
    throw new Error("This function should never be called in this strategy");
  }

  getResult(votes, context) {
    throw new Error("Not implemented");
  }
}

module.exports = BaseStrategy;
