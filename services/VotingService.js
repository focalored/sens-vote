const Session = require("../models/Session");
const Round = require("../models/Round");

const RoundInitializer = require("../builders/RoundInitializer");
const RoundFinalizer = require("../builders/RoundFinalizer");

const getNextState = require("../states/sessionStateMachine");
const guardState = require("../states/guardState");

const SoloStrategy = require("../strategies/soloStrategy");
const ExecStrategy = require("../strategies/execStrategy");
const PandahoodStrategy = require("../strategies/pandahoodStrategy");

class VotingService {
  constructor() {
    this.strategies = {
      solo: new SoloStrategy(),
      exec: new ExecStrategy(),
      pandahood: new PandahoodStrategy()
    };
  }

  async getSessions() {
    return Session.find({});
  }

  async getSession(sessionId) {
    return await this._requireSession(sessionId);
  }

  async createSession() {
    const session = await Session.create({
      status: "draft",
      type: null,
      configuration: null,
      initialCandidates: null
    });

    return session;
  }

  async startSession(sessionId, { type, candidates, voterCount, song = undefined, role = undefined }) {
    const session = await this._requireSession(sessionId);
    guardState(session, "draft");

    session.type = type;
    session.configuration = this._getConfigForType(type, voterCount, song, role);
    session.initialCandidates = this._shuffleCandidates(candidates);

    const nextState = getNextState(session.status, "startSession")
    if (!nextState) throw new Error("Invalid state transition");
    
    session.status = nextState;
    await session.save();

    return session;
  }

  async advanceToNextRound(sessionId, providedCandidates = null) {
    const session = await this._requireSession(sessionId);
    guardState(session, "awaiting_moderator");

    const previousRounds = await Round.find({ _id: { $in: session.roundIds } }).sort({ roundNumber: 1 });

    if (previousRounds.length === 0 && !providedCandidates) {
      throw new Error("First round must have manually provided candidates");
    }

    const initializer = new RoundInitializer({
      sessionId,
      strategy: this.strategies[session.type],
      rounds: previousRounds,
      providedCandidates
    });

    const newRound = initializer.initializeRound();
    const createdRound = await Round.create(newRound);

    session.roundIds.push(createdRound._id);
    
    const nextState = getNextState(session.status, "advance");
    if (!nextState) throw new Error("Invalid state transition");
    
    session.status = nextState;
    await session.save();

    return createdRound;
  }

  async submitVotes(sessionId, roundId, votes) {
    const session = await this._requireSession(sessionId);
    guardState(session, "awaiting_votes");

    const rounds = await Round.find({ _id: { $in: session.roundIds } }).sort({ roundNumber: 1 });
    const currentRound = this._requireRound(rounds, roundId);
    const previousRound = rounds.at(-2);

    if (!currentRound) throw new Error("Round not found");

    const finalizer = new RoundFinalizer({
      strategy: this.strategies[session.type],
      currentRound,
      previousRound,
      voterCount: session.configuration.voterCount
    });

    const finalizedRound = finalizer.finalizeRound({ votes });

    currentRound.votes = finalizedRound.votes;
    currentRound.result = finalizedRound.result;
  
    await currentRound.save();

    const nextState = getNextState(session.status, "submitVotes");
    if (!nextState) throw new Error("Invalid state transition");
    
    session.status = nextState;
    await session.save();

    return finalizedRound;
  }

  async finalizeSession(sessionId) {
    const session = await this._requireSession(sessionId);
    guardState(session, "awaiting_moderator");

    const nextState = getNextState(session.status, "finalize");
    if (!nextState) throw new Error("Invalid state transition");
    
    session.status = nextState;
    await session.save();
    return session;
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
  _getConfigForType(type, voterCount, song, role) {
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

  async _requireSession(sessionId) {
    const session = await Session.findById(sessionId);
    if (!session) {
      const err = new Error("Session not found");
      err.name = "NotFoundError";
      throw err;
    }
    return session;
  }

  _requireRound(rounds, roundId) {
    const round = rounds.find((r) => r.id === roundId);
    if (!round) {
      const err = new Error("Round not found");
      err.name = "NotFoundError";
      throw err;
    }
    return round;
  }
}

module.exports = VotingService;