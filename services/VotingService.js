const Session = require("../models/Session");
const Round = require("../models/Round");

const RoundInitializer = require("../builders/RoundInitializer");
const RoundFinalizer = require("../builders/RoundFinalizer");

const getNextState = require("../states/sessionStateMachine");
const guardState = require("../states/guardState");

const validateProvidedCandidates = require('../validators/validateProvidedCandidates');
const validateVotesAgainstCandidates = require('../validators/validateVotesAgainstCandidates');

const {
  ValidationError,
  DomainError,
  NotFoundError,
  InvalidStateTransitionError,
} = require('../errors');

const getDefaultCandidatesForStrategy = require('../utils/getDefaultCandidatesForStrategy');
const shuffle = require('../utils/shuffle');

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

  async getRound(sessionId, roundId) {
    const { round } = await this._requireSessionAndRound(sessionId, roundId);
    return round;
  }

  async getSessions() {
    return Session.find({});
  }

  async getSession(sessionId) {
    const session = await this._requireSession(sessionId);
    return session;
  }

  async createSession() {
    const session = await Session.create({
      status: "draft",
    });
    return session;
  }

  async startSession(
    sessionId,
    { type, candidates, voterCount, proposal = null, song = null, role = null }
  ) {
    const session = await this._requireSession(sessionId);
    
    guardState(session, "draft");

    validateProvidedCandidates(candidates, 0);

    session.type = type;
    session.configuration = this._getConfigForType(
      type,
      voterCount,
      proposal,
      song,
      role,
    );
    session.initialCandidates = shuffle(candidates);
    session.roundIds = [];

    const nextState = getNextState(session.status, "startSession");
    if (!nextState) {
      throw new InvalidStateTransitionError(session.status, 'startSession');
    }

    session.status = nextState;
    await session.save();

    return session;
  }

  async advanceToNextRound(
    sessionId,
    providedCandidates = null
  ) {
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

    const candidatesToUse = defaultCandidates || providedCandidates;

    validateProvidedCandidates(candidatesToUse, previousRounds.length);

    const initializer = new RoundInitializer({
      sessionId,
      strategy: this.strategies[session.type],
      rounds: previousRounds,
      providedCandidates: candidatesToUse,
      candidateType,
    });

    const newRound = initializer.initializeRound();
    const createdRound = await Round.create(newRound);

    session.roundIds.push(createdRound._id);

    const nextState = getNextState(session.status, "advanceRound");
    if (!nextState) {
      throw new InvalidStateTransitionError(session.status, 'advanceToNextRound');
    }

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
    if (rounds.length === 0) throw new NotFoundError('No rounds found for this session');

    const currentRound = rounds[rounds.length - 1];
    if (currentRound._id.toString() !== roundId) throw new DomainError('Round is not the current active round');
    
    const previousRound = rounds.at(-2);

    const strategy = this.strategies[session.type];
    validateVotesAgainstCandidates(
      votes,
      currentRound.candidates,
      strategy.constructor.expectedOptions || null
    );

    const finalizer = new RoundFinalizer({
      strategy,
      currentRound,
      previousRound,
      voterCount: session.configuration.voterCount,
    });

    const finalizedRound = finalizer.finalizeRound(votes);

    currentRound.votes = finalizedRound.votes;
    currentRound.result = finalizedRound.result;

    await currentRound.save();

    const nextState = getNextState(session.status, "submitVotes");
    if (!nextState) {
      throw new InvalidStateTransitionError(session.status, 'submitVotes');
    }

    session.status = nextState;
    await session.save();

    return currentRound;
  }

  async finalizeSession(sessionId) {
    const session = await this._requireSession(sessionId);

    guardState(session, "awaiting_moderator");

    const nextState = getNextState(session.status, "finalizeSession");
    if (!nextState) {
      throw new InvalidStateTransitionError(session.status, 'finalizeSession');
    }

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
    switch (type) {
      case 'solo':
        return { voterCount, song, proposal: null, role: null };
      case 'exec':
        return { voterCount, role, proposal: null, song: null };
      case 'callback':
        return { voterCount, song, proposal: null, role: null };
      case 'pandahood':
        return { voterCount, proposal, song, role: null };
      default:
        throw new ValidationError(`Invalid session type: ${type}`);
    }
  }

  async _requireSession(sessionId) {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    return session;
  }

  async _requireSessionAndRound(sessionId, roundId) {
    const session = await this._requireSession(sessionId);
    const round = await Round.findById(roundId);

    if (!round) {
      throw new NotFoundError(`Round with id ${roundId} not found`);
    }

    if (!session.roundIds.some(id => id.toString() === roundId)) {
      throw new DomainError(`Round with id ${roundId} does not belong to session with id ${sessionId}`);
    }

    return { session, round };
  }
}

module.exports = VotingService;
