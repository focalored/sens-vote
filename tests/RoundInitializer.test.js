const RoundInitializer = require('../builders/RoundInitializer');
const { ValidationError } = require('../errors');

describe('RoundInitializer', () => {
  const mockStrategy = {
    determineMode: jest.fn().mockReturnValue('full'),
    suggestCandidates: jest.fn().mockReturnValue(['Alice']),
  };

  describe('initializeRound', () => {
    const SESSION_ID = 'session-123';
    const ROUND_ID = 'round-123';
    let mockRound;

    it('should use provided candidates when available', () => {
      const initializer = new RoundInitializer({
        sessionId: SESSION_ID,
        strategy: mockStrategy,
        rounds: [],
        providedCandidates: ['Alice', 'Bob'],
        candidateType: 'names'
      });

      const round = initializer.initializeRound();
      expect(mockStrategy.suggestCandidates).not.toHaveBeenCalled();
      expect(round.candidates).toStrictEqual(['Alice', 'Bob']);
      expect(round.metadata).toStrictEqual({ candidateType: 'names' });
      expect(round.roundNumber).toBe(1);
      expect(round.evalMode).toBe('full')
    });

    it('should call strategy to suggest candidates if provided candidates not provided', () => {
      mockRound = {
        _id: ROUND_ID,
        sessionId: SESSION_ID,
        roundNumber: 1,
        result: { isComplete: false },
      };

      const mockRound2 = {
        _id: 'round-456',
        sessionId: SESSION_ID,
        roundNumber: 2,
        result: { isComplete: false },
      }

      const initializer = new RoundInitializer({
        sessionId: SESSION_ID,
        strategy: mockStrategy,
        rounds: [mockRound, mockRound2],
        providedCandidates: null,
        candidateType: 'names'
      });

      const round = initializer.initializeRound();
      expect(mockStrategy.determineMode).toHaveBeenCalledWith(mockRound2);
      expect(mockStrategy.suggestCandidates).toHaveBeenCalledWith(mockRound2, 'full');
      expect(round.candidates).toStrictEqual(['Alice']);
      expect(round.roundNumber).toBe(3);
      expect(round.evalMode).toBe('full')
    });

    it('should throw if constructor parameters missing', () => {
      expect(() => new RoundInitializer({ sessionId: null, strategy: null, rounds: null, providedCandidates: null, candidateType: null })).toThrow(ValidationError);
    });

    it('should throw if provided candidates is an empty array', () => {
      expect (() => new RoundInitializer({
        sessionId: SESSION_ID,
        strategy: mockStrategy,
        rounds: [],
        providedCandidates: [],
        candidateType: 'names'
      })).toThrow(ValidationError);
    });
  });
});
