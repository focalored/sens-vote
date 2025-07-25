const VotingService = require('../services/VotingService');
const Session = require('../models/Session');
const Round = require('../models/Round');
const RoundInitializer = require('../builders/RoundInitializer');
const RoundFinalizer = require('../builders/RoundFinalizer');

const getNextState = require('../states/sessionStateMachine');

const shuffle = require('../utils/shuffle');
const getDefaultCandidatesForStrategy = require('../utils/getDefaultCandidatesForStrategy');

jest.mock('../models/Session');
jest.mock('../models/Round');
jest.mock('../builders/RoundInitializer');
jest.mock('../builders/RoundFinalizer');
jest.mock('../states/sessionStateMachine');
jest.mock('../utils/shuffle');
jest.mock('../utils/getDefaultCandidatesForStrategy');

const {
  SessionStatusError,
  DomainError,
  ValidationError,
  CandidateValidationError,
  VoteCandidateValidationError,
  NotFoundError,
  InvalidStateTransitionError,
} = require('../errors');

describe('VotingService', () => {
  let votingService;

  beforeEach(() => {
    votingService = new VotingService();
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should return created session with default draft state', async () => {
      const mockSession = { status: 'draft', save: jest.fn() };
      Session.create.mockResolvedValue(mockSession);

      const result = await votingService.createSession();

      expect(Session.create).toHaveBeenCalledWith({
        status: 'draft',
        type: null,
        configuration: null,
        initialCandidates: null,
      });
      expect(result).toBe(mockSession);
    });
  });

  describe('startSession', () => {
    let mockSession, reqBody, shuffled;
    const SESSION_ID = 'session-123';

    beforeEach(() => {
      jest.clearAllMocks();

      mockSession = {
        _id: SESSION_ID,
        status: 'draft',
        type: null,
        configuration: null,
        roundIds: [],
        initialCandidates: null,
        save: jest.fn(),
      };

      reqBody = {
        type: 'solo',
        candidates: ['Alice', 'Bob', 'Connor'],
        voterCount: 20,
        song: 'Mirrors',
      };

      shuffled = ['Alice', 'Connor', 'Bob'];

      Session.findById.mockResolvedValue(mockSession);
      shuffle.mockReturnValue(shuffled);
      getNextState.mockReturnValue('awaiting_moderator');
    });

    it('should return started session with valid input', async () => {
      const result = await votingService.startSession(SESSION_ID, reqBody);

      expect(mockSession.type).toBe('solo'),
      expect(mockSession.configuration).toStrictEqual({
        voterCount: 20,
        proposal: null,
        song: 'Mirrors',
        role: null,
      });
      expect(mockSession.initialCandidates).toStrictEqual(shuffled);

      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toBe(mockSession);
    });

    it('should throw if sessionId does not exist', async () => {
      Session.findById.mockResolvedValue(null);

      await expect(
        votingService.startSession('nonexistent-id', {})
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw if provided candidates has duplicates and empty strings', async () => {
      reqBody.candidates = ['alice', 'Alice', ' ', 'Bob'];

      await expect(
        votingService.startSession(SESSION_ID, reqBody)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw if invalid session state', async () => {
      mockSession.status = 'awaiting_moderator';

      await expect(
        votingService.startSession(SESSION_ID, {})
      ).rejects.toThrow(SessionStatusError);
    });

    it('should throw if invalid session state transition', async () => {
      getNextState.mockReturnValue(null);

      await expect(
        votingService.startSession(SESSION_ID, reqBody)
      ).rejects.toThrow(InvalidStateTransitionError);

      expect(getNextState).toHaveBeenCalledWith('draft', 'startSession');
    });
  });

  describe('advanceToNextRound', () => {
    let mockSession, mockRound, initializeRoundResult;
    const SESSION_ID = 'session-123';
    const ROUND_ID = 'round-123';

    beforeEach(() => {
      jest.clearAllMocks();

      RoundInitializer.mockImplementation(() => ({
        initializeRound: jest.fn().mockReturnValue(initializeRoundResult),
      }));
    
      initializeRoundResult = {
        sessionId: SESSION_ID,
        roundNumber: 1,
        candidates: ['Alice', 'Bob', 'Connor'],
        metadata: { candidateType: 'names' },
        evalMode: 'full',
      };
    
      mockSession = {
        _id: SESSION_ID,
        status: 'awaiting_moderator',
        type: 'exec',
        configuration: {
          voterCount: 20,
          proposal: null,
          song: null,
          role: 'Group Coordinator',
        },
        roundIds: [],
        initialCandidates: ['Alice', 'Bob', 'Connor'],
        save: jest.fn(),
      };

      mockRound = {
        _id: ROUND_ID,
        sessionId: SESSION_ID,
        roundNumber: 1,
        candidates: ['Alice', 'Bob', 'Connor'],
        metadata: { candidateType: 'names' },
        evalMode: 'full',
        save: jest.fn(),
      };
    
      Session.findById.mockResolvedValue(mockSession);
      Round.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });
      getDefaultCandidatesForStrategy.mockReturnValue({
        candidates: null,
        candidateType: 'names',
      });
      Round.create.mockResolvedValue(mockRound);
      getNextState.mockReturnValue('awaiting_votes');
    });

    it('should return initialized round', async () => {
      const result = await votingService.advanceToNextRound(
        SESSION_ID,
        mockSession.initialCandidates
      );

      expect(mockSession.status).toBe('awaiting_votes');
      expect(mockSession.roundIds).toStrictEqual([ROUND_ID]);
      expect(Round.create).toHaveBeenCalledWith(initializeRoundResult);
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toBe(mockRound);
    });

    it('should throw if no provided candidates for 1st round', async () => {
      await expect(votingService.advanceToNextRound(
        SESSION_ID,
        undefined,
      )).rejects.toThrow(CandidateValidationError);

      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(Round.find).toHaveBeenCalled();
      expect(getDefaultCandidatesForStrategy).toHaveBeenCalledWith('exec');
    });

    it('should pass if no provided candidates for subsequent rounds', async () => {
      mockSession.roundIds.push(ROUND_ID);

      const mockRound2 = {
        ...mockRound,
        _id: 'round-456',
        roundNumber: 2,
      };

      const initializeRoundResult2 = {
        ...initializeRoundResult,
        roundNumber: 2,
      };

      // Mock finished round
      mockRound = {
        ...mockRound,
        votes: [
          { candidateId: 'Alice', count: 7 },
          { candidateId: 'Bob', count: 7 },
          { candidateId: 'Connor', count: 6 },
        ],
        result: {
          type: 'exec',
          winners: { role: null },
          isComplete: false,
        },
      };

      RoundInitializer.mockImplementation(() => ({
        initializeRound: jest.fn().mockReturnValue(initializeRoundResult2),
      }));
      Round.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockRound])});
      Round.create.mockResolvedValue(mockRound2);

      const result = await votingService.advanceToNextRound(
        SESSION_ID,
        null
      );
      
      expect(mockSession.status).toBe('awaiting_votes');
      expect(mockSession.roundIds).toStrictEqual([ROUND_ID, 'round-456']);
      expect(Round.create).toHaveBeenCalledWith(initializeRoundResult2);
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toBe(mockRound2);
    });

    it('should throw if provided candidates has duplicates and empty strings', async () => {
      await expect(votingService.advanceToNextRound(
        SESSION_ID,
        ['Alice', 'alice', ' ', 'Bob']
      )).rejects.toThrow(CandidateValidationError);

      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(Round.find).toHaveBeenCalled();
      expect(getDefaultCandidatesForStrategy).toHaveBeenCalledWith('exec');
    });

    it('should throw if invalid session state', async () => {
      mockSession.status = 'draft';

      await expect(votingService.advanceToNextRound(
        SESSION_ID,
        mockSession.initialCandidates
      )).rejects.toThrow(SessionStatusError);

      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
    });

    it('should throw if invalid session state transition', async () => {
      getNextState.mockReturnValue(null);

      await expect(votingService.advanceToNextRound(
        SESSION_ID,
        mockSession.initialCandidates
      )).rejects.toThrow(InvalidStateTransitionError);

      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(Round.find).toHaveBeenCalled();
      expect(getDefaultCandidatesForStrategy).toHaveBeenCalledWith('exec');
      expect(Round.create).toHaveBeenCalledWith(initializeRoundResult);
      expect(getNextState).toHaveBeenCalledWith('awaiting_moderator', 'advanceRound');
    });
  });

  describe('submitVotes', () => {
    let mockSession, mockRound, mockVotes, finalizeRoundResult;
    const SESSION_ID = 'session-123';
    const ROUND_ID = 'round-123';
    
    beforeEach(() => {
      jest.clearAllMocks();

      RoundFinalizer.mockImplementation(() => ({
        finalizeRound: jest.fn().mockReturnValue(finalizeRoundResult),
      }));

      mockSession = {
        _id: SESSION_ID,
        status: 'awaiting_votes',
        type: 'exec',
        configuration: {
          voterCount: 20,
          proposal: null,
          song: null,
          role: 'Group Coordinator',
        },
        roundIds: [ROUND_ID],
        initialCandidates: ['Alice', 'Bob', 'Connor'],
        save: jest.fn(),
      };

      mockRound = {
        _id: ROUND_ID,
        sessionId: SESSION_ID,
        roundNumber: 1,
        candidates: ['Alice', 'Bob', 'Connor'],
        metadata: { candidateType: 'names' },
        evalMode: 'full',
        save: jest.fn(),
      };

      mockVotes = [
        { candidateId: 'Alice', count: 3 },
        { candidateId: 'Connor', count: 1 },
        { candidateId: 'Bob', count: 16 },
      ];

      finalizeRoundResult = {
        ...mockRound,
        votes: mockVotes,
        result: {
          type: 'exec',
          winners: { role: 'Group Coordinator' },
          isComplete: true,
        },
      };

      Session.findById.mockResolvedValue(mockSession);
      Round.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockRound]),
      });
      getNextState.mockReturnValue('awaiting_moderator');
    });

    it('should return finalized round', async () => {
      const result = await votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      );

      expect(mockSession.status).toBe('awaiting_moderator');
      expect(mockSession.save).toHaveBeenCalled();

      expect(mockRound.votes).toStrictEqual(finalizeRoundResult.votes);
      expect(mockRound.result).toStrictEqual(finalizeRoundResult.result);
      expect(mockRound.save).toHaveBeenCalled();
      expect(result).toBe(mockRound);
    });

    it('should throw if no existing rounds found for session', async () => {
      mockSession.roundIds = [];
      Round.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await expect(votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      )).rejects.toThrow(NotFoundError);
    });

    it('should throw if latest round is not desired current round', async () => {
      const newerRound = {
        _id: 'round-456',
        sessionId: SESSION_ID,
        roundNumber: 2,
      }
      
      mockSession.roundIds = [ROUND_ID, 'round-456'];
      Round.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockRound, newerRound]),
      });

      await expect(votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      )).rejects.toThrow(DomainError);
    });

    it('should throw if votes do not match candidates', async () => {
      mockVotes.push('Connor');

      await expect(votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      )).rejects.toThrow(VoteCandidateValidationError);
    });

    it('should throw if votes do not match expected options', async () => {
      mockSession.type = 'callback';
      mockRound.metadata = { candidateType: 'options' };
      mockRound.candidates = ['expectedOptionB', 'expectedOptionA'];
      votingService.strategies[mockSession.type].constructor.expectedOptions = [
        'expectedOptionA',
        'expectedOptionB',
      ];

      mockVotes = [
        { candidateId: 'expectedOptionA', count: 10 },
        { candidateId: 'shrug', count: 9 },
      ];

      await expect(votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      )).rejects.toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Missing option "expectedOptionB" in candidates or votes',
      });
    });

    it('should throw if invalid session state', async () => {
      mockSession.status = 'complete';

      await expect(votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      )).rejects.toThrow(SessionStatusError);
    });

    it('should throw if invalid session state transition', async () => {
      getNextState.mockReturnValue(null);

      await expect(votingService.submitVotes(
        SESSION_ID,
        ROUND_ID,
        mockVotes
      )).rejects.toThrow(InvalidStateTransitionError);

      expect(getNextState).toHaveBeenCalledWith('awaiting_votes', 'submitVotes');
    });
  });

  describe('finalizeSession', () => {
    let mockSession;
    const SESSION_ID = 'session-123';
    const ROUND_ID = 'round-123'

    beforeEach(() => {
      jest.clearAllMocks();

      mockSession = {
        _id: SESSION_ID,
        status: 'awaiting_moderator',
        type: 'exec',
        configuration: {
          voterCount: 20,
          proposal: null,
          song: null,
          role: 'Group Coordinator',
        },
        roundIds: [ROUND_ID],
        initialCandidates: ['Alice', 'Bob', 'Connor'],
        save: jest.fn(),
      };

      Session.findById.mockResolvedValue(mockSession);
      getNextState.mockReturnValue('complete');
    });

    it('should return finalized session', async () => {
      const result = await votingService.finalizeSession(SESSION_ID);

      expect(mockSession.status).toBe('complete');
      expect(mockSession.save).toHaveBeenCalled();
      expect(result).toBe(mockSession);
    });

    it('should throw if invalid session state', async () => {
      mockSession.status = 'awaiting_votes';

      await expect(votingService.finalizeSession(SESSION_ID)).rejects.toThrow(SessionStatusError);
    });

    it('should throw if invalid session state transition', async () => {
      getNextState.mockReturnValue(null);

      await expect(votingService.finalizeSession(SESSION_ID)).rejects.toThrow(InvalidStateTransitionError);

      expect(getNextState).toHaveBeenCalledWith('awaiting_moderator', 'finalizeSession');
    });

    it('should throw when submitting votes to finalized session', async () => {
      await votingService.finalizeSession(SESSION_ID);
      await expect(votingService.submitVotes(SESSION_ID, ROUND_ID, [])).rejects.toThrow(SessionStatusError);
    });
  });

  describe('_getConfigForType', () => {
    it('should return solo config', () => {
      const result = votingService._getConfigForType('solo', 20, null, 'Mirrors', null);

      expect(result).toStrictEqual({
        voterCount: 20,
        proposal: null,
        song: 'Mirrors',
        role: null,
      });
    });

    it('should return exec config', () => {
      const result = votingService._getConfigForType('exec', 20, null, null, 'Group Coordinator');

      expect(result).toStrictEqual({
        voterCount: 20,
        proposal: null,
        song: null,
        role: 'Group Coordinator',
      });
    });

    it('should return callback config', () => {
      const result = votingService._getConfigForType('callback', 20, null, 'Mirrors', null);

      expect(result).toStrictEqual({
        voterCount: 20,
        proposal: null,
        song: 'Mirrors',
        role: null,
      });
    });

    it('should return solo config', () => {
      const result = votingService._getConfigForType('pandahood', 20, 'Alice - Unconditional accept', 'Mirrors', null);

      expect(result).toStrictEqual({
        voterCount: 20,
        proposal: 'Alice - Unconditional accept',
        song: 'Mirrors',
        role: null,
      });
    });

    it('should throw other if type is invalid', () => {
      expect(() => votingService._getConfigForType('invalid', 20, null, 'Mirrors', null)).toThrow(DomainError);
    });
  });

  describe('_requireSession', () => {
    let mockSession;
    const SESSION_ID = 'session-123';

    beforeEach(() => {
      jest.clearAllMocks();
      
      mockSession = {
        _id: SESSION_ID,
        status: 'draft',
        save: jest.fn(),
      };

      Session.findById.mockResolvedValue(mockSession);
    });

    it('should return the requested session if sessionId valid', async () => {
      const result = await votingService._requireSession(SESSION_ID);

      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(result).toStrictEqual(mockSession);
    });

    it('should throw if session not found', async () => {      
      Session.findById.mockResolvedValue(null);

      await expect(votingService._requireSession(SESSION_ID)).rejects.toThrow(NotFoundError);
      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
    });

    it('should throw if database call fails', async () => {
      Session.findById.mockRejectedValue(new Error('DB failure'));

      await expect(votingService._requireSession(SESSION_ID)).rejects.toThrow('DB failure');
    });
  });

  describe('_requireSessionAndRound', () => {
    let mockSession, mockRound;
    const SESSION_ID = 'session-123';
    const ROUND_ID = 'round-123';

    beforeEach(() => {
      jest.clearAllMocks();

      mockSession = {
        _id: SESSION_ID,
        status: 'draft',
        roundIds: [ROUND_ID],
        save: jest.fn(),
      };

      mockRound = {
        votes: [],
        save: jest.fn(),
      };

      Session.findById.mockResolvedValue(mockSession);
      Round.findById.mockResolvedValue(mockRound);
    });

    it('should return the requested round', async () => {
      const { _, round } = await votingService._requireSessionAndRound(SESSION_ID, ROUND_ID);

      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(Round.findById).toHaveBeenCalledWith(ROUND_ID);
      expect(round).toStrictEqual(mockRound);
    });

    it('should throw if session not found', async () => {      
      Session.findById.mockResolvedValue(null);

      await expect(votingService._requireSessionAndRound(SESSION_ID, ROUND_ID)).rejects.toThrow(NotFoundError);
      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
    });

    it('should throw if session found but round not found', async () => {
      Round.findById.mockResolvedValue(null);

      await expect(votingService._requireSessionAndRound(SESSION_ID, ROUND_ID)).rejects.toThrow(NotFoundError);
      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(Round.findById).toHaveBeenCalledWith(ROUND_ID);
    });

    it('should throw if round does not belong to round', async () => {
      mockSession.roundIds = ['round-456'];

      await expect(votingService._requireSessionAndRound(SESSION_ID, ROUND_ID)).rejects.toThrow(DomainError);
      expect(Session.findById).toHaveBeenCalledWith(SESSION_ID);
      expect(Round.findById).toHaveBeenCalledWith(ROUND_ID);
    });

    it('should throw if database call fails', async () => {
      Session.findById.mockRejectedValue(new Error('DB failure'));

      await expect(votingService._requireSessionAndRound(SESSION_ID, ROUND_ID)).rejects.toThrow('DB failure');
    });
  });
});
