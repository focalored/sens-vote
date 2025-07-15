const VotingSession = require("../models/VotingSession");
const SoloStrategy = require("../strategies/soloStrategy");
const ExecStrategy = require("../strategies/execStrategy");
const PandahoodStrategy = require("../strategies/pandahoodStrategy");

class VotingSessionService {
  constructor(db, { strategies, SessionModel } = {}) {
    this.db = db;
    this.Session = SessionModel || VotingSession;
    this.strategies = strategies || {
      solo: new SoloStrategy(),
      exec: ExecStrategy,
      pandahood: new PandahoodStrategy(),
    };
  }

  async getSession(id) {
    const session = await this.Session.findById(id);

    if (!session) throw new Error("Session not found");

    return session;
  }

  /**
   * Creates a new voting session and saves it to DB.
   * Fetches configuration and a shuffled candidates list using helpers.
   * 
   * @param {Object} params - Params for session creation.
   * @param {string} params.type - The type of voting strategy to use for this session ("solo", "exec", "pandahood")
   * @param {string[]} params.candidates - The initial list of candidates.
   * @param {number} params.voterCount - The number of voters.
   * @param {string=} params.song - The song sung during the solo/membership audition.
   * @param {string=} params.role - The exec role for an exec election.
   * @returns {Object} A new MongoDB document containing initial data for this session.
   */
  async createSession({ type, candidates, voterCount, song = undefined, role = undefined }) {
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
   * 
   * @param {string} id - The id of the voting session.
   * @param {Object} params - The data given for the new round.
   * @param {number[]} params.votes - Array of votes corresponding to the candidates, same order as the initial candidates list.
   * @param {string[]=} params.candidates - Optional list of candidates for this round. If omitted, the strategy will determine the next candidates.
   * @returns {Object} The newly added round data.
   */
  async addRound(id, { votes, candidates = undefined }) {
    const session = await this.Session.findById(id);

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

  /**
   * Sets the configuration data for a new voting session.
   * 
   * @param {Object} params - The params for configuring a voting session.
   * @param {string} params.type - The voting strategy type used in this session.
   * @param {number} params.voterCount - The number of voters in this session.
   * @param {string=} params.song - The song sung during the solo/membership audition.
   * @param {string=} params.role - The role applied for during the exec election.
   * @returns {Object} Configuration data to be stored as part of a new session.
   */
  _getConfigForType({ type, voterCount, song, role }) {
    const config = {
      solo: { voterCount, song },
      exec: { voterCount, role },
      pandahood: { voterCount, song }
    };

    return config[type];
  }

  /**
   * Shuffles a list of candidates.
   * @param {string[]} candidates - Candidates entering the first round of this voting session. 
   * @returns {string[]} A shuffleled list of the candidates.
   */
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
   * @param {string} params.type - The type of voting strategy to use ("solo", "exec", "pandahood")
   * @param {number} params.voterCount - Number of voters in the session.
   * @param {Object[]} params.previousRounds - List of data for previous rounds in this session.
   * @param {string[]} params.initialCandidates - List of candidates when the session was first created.
   * @param {string[]} [params.candidates] - Optional custom candidates for the new round.
   * @param {number[]} params.votes - Votes corresponding to the candidates for this round.
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
