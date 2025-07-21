const Session = require("../models/Session");
const Round = require("../models/Round");

const RoundInitializer = require("../builders/RoundInitializer");
const RoundFinalizer = require("../builders/RoundFinalizer");

const getNextState = require("../states/sessionStateMachine");
const guardState = require("../states/guardState");

const getDefaultCandidatesForStrategy = require('../utils/getDefaultCandidatesForStrategy');

const SoloStrategy = require("../strategies/SoloStrategy");
const ExecStrategy = require("../strategies/ExecStrategy");
const CallbackStrategy = require('../strategies/CallbackStrategy');
const PandahoodStrategy = require("../strategies/PandahoodStrategy");

class VotingService {
  constructor() {
    this.strategies = {
      solo: new SoloStrategy(),
      exec: new ExecStrategy(),
      callback: new CallbackStrategy(),
      pandahood: new PandahoodStrategy(),
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
      initialCandidates: null,
    });

    return session;
  }

  async startSession(
    sessionId,
    { type, candidates, voterCount, proposal = null, song = null, role = null },
  ) {
    const session = await this._requireSession(sessionId);
    guardState(session, "draft");

    session.type = type;
    session.configuration = this._getConfigForType(
      type,
      voterCount,
      proposal,
      song,
      role,
    );
    session.initialCandidates = this._shuffleCandidates(candidates);

    const nextState = getNextState(session.status, "startSession");
    if (!nextState) throw new Error("Invalid state transition");

    session.status = nextState;
    await session.save();

    return session;
  }

  async advanceToNextRound(sessionId, providedCandidates = null) {
    const session = await this._requireSession(sessionId);
    guardState(session, "awaiting_moderator");

    const previousRounds = await Round.find({
      _id: { $in: session.roundIds },
    }).sort({ roundNumber: 1 });

    /**
     * If type === 'callback', frontend still sends the cached session.initialCandidates over to the advanceToNextRound's endpoint for starting 1st round.
     * But here we hardcode the sent over list containing only the auditionee's name into options (definitely/maybe/no callback, abstain).
     * If this is the second round, where the auditionee was previusly placed in the 'Possible callback' bucket, we do the same hardcoding, because it's the same 4 options.
     */
    let { candidates: defaultCandidates, candidateType } = getDefaultCandidatesForStrategy(session.type);

    if (previousRounds.length === 0 && !providedCandidates && !defaultCandidates) {
      const err = new Error("First round must have manually provided candidates");
      // No initial candidates but in reality should be frontend's fault, not user's
      err.name = 'NoInitialCandidatesError';
      throw err;
    }

    providedCandidates = defaultCandidates ?? providedCandidates;

    const initializer = new RoundInitializer({
      sessionId,
      strategy: this.strategies[session.type],
      rounds: previousRounds,
      providedCandidates,
      candidateType,
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

    const rounds = await Round.find({ _id: { $in: session.roundIds } }).sort({
      roundNumber: 1,
    });
    const currentRound = this._requireRound(rounds, roundId);
    const previousRound = rounds.at(-2);

    if (!currentRound) throw new Error("Round not found");

    const finalizer = new RoundFinalizer({
      strategy: this.strategies[session.type],
      currentRound,
      previousRound,
      voterCount: session.configuration.voterCount,
    });

    const finalizedRound = finalizer.finalizeRound(votes);

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
  _getConfigForType(type, voterCount, proposal, song, role) {
    const config = {
      solo: { voterCount, song },
      exec: { voterCount, role },
      callback: { voterCount, song },
      pandahood: { voterCount, proposal, song },
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
