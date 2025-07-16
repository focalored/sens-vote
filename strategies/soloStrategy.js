const BaseStrategy = require("./baseStrategy");

class SoloStrategy extends BaseStrategy {
  determineMode(previousRound) {
    if (!previousRound) return "full";
    
    const { soloist, understudy } = previousRound.result.winners;
    return soloist && !understudy ? "understudy_only" : "full";
  }

  suggestNextCandidates(previousRound, evalMode) {
    const { candidates, votes } = previousRound;

    const candidateVotes = candidates.map((candidate, i) => [candidate, votes[i]]);

    if (evalMode === "understudy_only") {
      const soloist = previousRound.result.winners.soloist;

      const nonSoloistVotes = candidateVotes.filter(([candidate]) => candidate !== soloist);
      if (nonSoloistVotes.length === 0) {
        throw new Error("No non-soloist candidates found for understudy round");
      }

      const topScore = Math.max(...nonSoloistVotes.map(([_, vote]) => vote));

      return nonSoloistVotes
        .filter(([_, vote]) => vote === topScore)
        .map(([candidate]) => candidate);
    }

    const topScore = Math.max(...candidateVotes.map(([_, vote]) => vote));

    return candidateVotes
      .filter(([_, vote]) => topScore - vote < 2)
      .map(([candidate]) => candidate);
  }
  
  getResult(votes, { candidates, voterCount, roundNumber, previousRound, evalMode }) {
    const sortedVotes = this._getSortedVotes(candidates, votes);

    if (sortedVotes.length < 2 && evalMode !== "understudy_only") {
      throw new Error("At least 2 candidates are required for full evaluation.");
    }

    const [first, second, ...rest] = sortedVotes;
    if (!first || !second) {
      throw new Error("Insufficient vote data to determine top two candidates.");
    }

    // Understudy-only logic
    if (evalMode === "understudy_only") {
      const soloist = previousRound?.result?.winners?.soloist || null;
      const understudy = first[1] > second[1] ? first[0] : null;

      return {
        winners: { soloist, understudy },
        isComplete: Boolean(understudy)
      };
    }

    // Full evaluation logic
    const isThresholdMet =
      roundNumber < 4
        ? first[1] >= second[1] + 2
        : first[1] > second[1];

    const soloist = isThresholdMet ? first[0] : null;
    const understudy =
      soloist && (!rest[0] || second[1] > rest[0][1])
        ? second[0]
        : null;

    return {
      winners: { soloist, understudy },
      isComplete: Boolean(soloist && understudy)
    };
  }
}

module.exports = SoloStrategy;
