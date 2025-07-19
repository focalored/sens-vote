const aggregateVotesFromBallots = (ballots) => {
  const tally = {};

  for (const ballot of ballots) {
    if (Array.isArray(ballot)) {
      for (const { candidateId, score } of ballot) {
        tally[candidateId] = (tally[candidateId] || 0) + score;
      }
    } else {
      const { candidateId, score } = ballot;
      tally[candidateId] = (tally[candidateId] || 0) + score;
    }
  }

  return Object.entries(tally).map(([candidateId, count]) => ({
    candidateId,
    count,
  }));
};

module.exports = { aggregateVotesFromBallots };
