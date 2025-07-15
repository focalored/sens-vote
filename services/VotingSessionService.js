const VotingSession = require("../models/VotingSession");
const SoloStrategy = require("../strategies/soloStrategy");
const ExecStrategy = require("../strategies/execStrategy");
const MembershipStrategy = require("../strategies/membershipStrategy");

class VotingSessionService {
  constructor(db, { strategies, SessionModel } = {}) {
    this.db = db;
    this.Session = SessionModel || VotingSession;
    this.strategies = strategies || {
      solo: new SoloStrategy(),
      exec: ExecStrategy,
      membership: MembershipStrategy
    };
  }

  async getSession(id) {
    return this.Session.findById(id);
  }

  async createSession({ type, candidates, voterCount, song = null, role = null }) {
    const session = new this.Session({
      type,
      status: "draft",
      configuration: this._getConfigForType({ type, voterCount, song, role }),
      initialCandidates: this._shuffleCandidates(candidates),
      rounds: [],
      createdAt: Date.now()
    });

    await session.save();
    return session;
  }
  
  /**
   * Adds a new round to an existing voting session.
   * @param {import("mongoose").Types.ObjectId | string} id - The _id of the voting session.
   * @param {number[]} votes - Array of votes corresponding to the candidates, same order as the initial candidates list.
   * @param {string[]=} candidates - Optional list of candidates for this round. If omitted, the strategy will determine the next candidates.
   * @returns {Object} The newly added round data.
   */
  async addRound(id, votes, candidates = undefined) {
    const session = await VotingSession.findById(id);
    if (!session) throw new Error("Session not found");

    const roundData = this._buildNewRoundData({
      type: session.type,
      voterCount: session.configuration.voterCount,
      previousRounds: session.rounds,
      initialCandidates: session.initialCandidates,
      candidates,
      votes
    });

    session.rounds.push(roundData);
    if (roundData.result.isComplete) {
      session.status = "complete";
      session.decidedAt = Date.now();
    }

    await session.save();
    return roundData;
  }

  // helpers
  _getConfigForType({ type, voterCount, song, role }) {
    const config = {
      solo: { voterCount, song },
      exec: { voterCount, role },
      membership: { voterCount, song }
    };

    return config[type];
  }

  _shuffleCandidates(candidates) {
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    return candidates;
  }

  /**
   * Builds data for the next round of voting based on previous rounds and current votes.
   * 
   * Steps:
   * - Fetches prior round data.
   * - Finalizes next round's candidates.
   * - For solo auditions: determines whether the next round is an understudy tiebreaker via evalMode.
   * - Delegates winner calculation to strategy.
   * - Prepares and returns the round object to be stored in database.
   * 
   * @param {Object} params - Params for round creation.
   * @param {string} params.type - The type of voting strategy to use ("solo", "exec", "membership")
   * @param {number} params.voterCount - Number of voters in the session.
   * @param {Array<Object>} params.previousRounds - List of data for previous rounds in this session.
   * @param {Array<string>} params.initialCandidates - List of candidates when the session was first created.
   * @param {Array<string>} [params.candidates] - Optional custom candidates for the new round.
   * @param {Array<number>} params.votes - Votes corresponding to the candidates for this round.
   * @returns {Object} Round data.
   */
  _buildNewRoundData({
    type,
    voterCount,
    previousRounds,
    initialCandidates,
    candidates: providedCandidates,
    votes}
  ) {
    const strategy = this.strategies[type];
    const evalMode = strategy.determineMode(previousRounds.at(-1));

    const candidates = providedCandidates ??
      (previousRounds.length === 0
        ? initialCandidates
        : strategy.suggestNextCandidates(previousRounds.at(-1), evalMode));
    console.log("candidates passed to getResult", candidates);

    const roundNumber = previousRounds.length + 1;

    const result = strategy.getResult(
      votes,
      {
        candidates,
        voterCount,
        roundNumber,
        previousRound: previousRounds.at(-1),
        evalMode
      });

    return {
      roundNumber,
      evalMode,
      candidates,
      votes,
      result
    };
  }
}

module.exports = VotingSessionService;
