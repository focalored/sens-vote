const RoundFinalizer = require('../builders/RoundFinalizer');
const { ValidationError } = require('../errors');

describe('RoundFinalizer', () => {
  let mockStrategy = {
    getResult: jest.fn().mockReturnValue({
      result: {
        type: 'solo',
        winners: { soloist: 'Alice', understudy: 'Connor' },
        isComplete: true
      },
      warnings: []
    }),
  };

  const SESSION_ID = 'session-123';
  const ROUND1_ID = 'round-123';
  const ROUND2_ID = 'round-456';

  let mockRound1 = {
    roundNumber: 1,
    evalMode: 'full',
    candidates: ['Alice', 'Bob', 'Connor'],
    result: {
      type: 'solo',
      result: { winners: { soloist: 'Alice', understudy: null } },
      isComplete: false
    },
  };

  let mockRound2 = {
    roundNumber: 2,
    evalMode: 'understudy_only',
    candidates: ['Bob', 'Connor'],
  };

  describe('finalizeRound', () => {
    it('should delegate to strategy for result calculation', () => {
      const finalizer = new RoundFinalizer({ strategy: mockStrategy, currentRound: mockRound2, previousRound: mockRound1, voterCount: 20 });

      const votes = [
        { candidateId: 'Connor', count: 16 },
        { candidateId: 'Bob', count: 4 },
      ];

      const result = finalizer.finalizeRound(votes);
      
      expect(mockStrategy.getResult).toHaveBeenCalledWith(
        votes,
        {
          voterCount: 20,
          roundNumber: 2,
          previousRound: mockRound1,
          evalMode: 'understudy_only'
        }
      )
      expect(result.result).toStrictEqual({
        type: 'solo',
        winners: { soloist: 'Alice', understudy: 'Connor' },
        isComplete: true
      });
    });

    it('should warn if strategy returns warnings', () => {
      mockStrategy = {
        ...mockStrategy,
        getResult: jest.fn().mockReturnValue({
          result: {
            type: 'solo',
            winners: { soloist: 'Alice', understudy: 'Connor' },
            isComplete: true
          },
          warnings: ['warning'],
        })
      };

      const finalizer = new RoundFinalizer({ strategy: mockStrategy, currentRound: mockRound2, previousRound: mockRound1, voterCount: 20 });

      const votes = [
        { candidateId: 'Connor', count: 16 },
        { candidateId: 'Bob', count: 4 },
      ];

      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = finalizer.finalizeRound(votes);
      
      expect(mockStrategy.getResult).toHaveBeenCalledWith(votes, expect.any(Object));
      expect(console.warn).toHaveBeenCalledWith('Strategy warnings:', ['warning']);
      expect(result.result).toStrictEqual({
        type: 'solo',
        winners: { soloist: 'Alice', understudy: 'Connor' },
        isComplete: true
      });

      console.warn.mockRestore();
    });

    it('should not mutate currentRound', () => {
      const finalizer = new RoundFinalizer({ strategy: mockStrategy, currentRound: mockRound2, previousRound: mockRound1, voterCount: 20 });

      const votes = [
        { candidateId: 'Connor', count: 16 },
        { candidateId: 'Bob', count: 4 },
      ];

      const original = { ...mockRound2 };

      finalizer.finalizeRound(votes);

      expect(mockRound2).toStrictEqual(original);
    });

    it('should throw if votes is not a non-empty array', () => {
      const finalizer = new RoundFinalizer({ strategy: mockStrategy, currentRound: mockRound2, previousRound: mockRound1, voterCount: 20 });

      expect(() => finalizer.finalizeRound([])).toThrow(ValidationError);
    });

    it('should throw if constructor parameters missing', () => {
      expect(() => new RoundFinalizer({ strategy: null, currentRound: null, previousRound: null, voterCount: null })).toThrow(ValidationError);
    });
  });
});
