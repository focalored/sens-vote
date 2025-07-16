const VotingSession = require("../models/VotingSession");
const RoundBuilder = require("../builders/RoundBuilder");
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
   * @param {Object} params - Body of request containing params for session creation.
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
   * @param {Object} params - Data for the new round sent in the request body.
   * @param {number[]} params.votes - Array of votes corresponding to the candidates, same order as the initial candidates list.
   * @param {string[]=} params.candidates - Optional list of candidates for this round. If omitted, the strategy will determine the next candidates.
   * @returns {Object} The newly added round data.
   */
  async addRound(id, { votes, candidates = undefined }) {
    const session = await this.Session.findById(id);

    if (!session) throw new Error("Session not found");

    const builder = new RoundBuilder(this.strategies, session, candidates, votes);

    const roundData = builder.build();

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
}

module.exports = VotingSessionService;
