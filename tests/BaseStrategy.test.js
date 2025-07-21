const BaseStrategy = require('../strategies/BaseStrategy');

describe('BaseStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new BaseStrategy();
  });

  describe('_getSortedVotes', () => {
    it('should return sorted votes in descending order and maintain relative order', () => {
      const result = strategy._getSortedVotes([
        { candidateId: 'Alice', count: 4 },
        { candidateId: 'Bob', count: 4 },
        { candidateId: 'Connor', count: 5 },
      ]);

      expect(result).toStrictEqual([
        { candidateId: 'Connor', count: 5 },
        { candidateId: 'Alice', count: 4 },
        { candidateId: 'Bob', count: 4 },
      ]);
    });

    it('should return an empty array if no votes provided', () => {
      const result = strategy._getSortedVotes([]);
      expect(result).toStrictEqual([]);
    });

    it('should return same array if only one vote is given', () => {
      const result = strategy._getSortedVotes([{ candidateId: 'Alice', count: 10 }]);
      expect(result).toStrictEqual([{ candidateId: 'Alice', count: 10 }]);
    })

    it('should not mutate the original array', () => {
      const input = [
        { candidateId: 'Alice', count: 4 },
        { candidateId: 'Bob', count: 3 },
        { candidateId: 'Connor', count: 5 },
      ];
      const originalCopy = [...input];
      strategy._getSortedVotes(input);
      expect(input).toStrictEqual(originalCopy);
    });
  });

  describe('determineMode', () => {
    it('should return "full"', () => {
      expect(strategy.determineMode()).toBe('full');
    });
  });

  describe('suggestNextCandidates', () => {
    it('should return the previous round candidates', () => {
      const result = strategy.suggestNextCandidates({
        candidates: ['Alice', 'Bob', 'Connor'],
      })
      expect(result).toStrictEqual(['Alice', 'Bob', 'Connor']);
    });
  });

  describe('getResult', () => {
    it('should throw when called', () => {
      expect(() => strategy.getResult()).toThrow('Not implemented');
    });
  });
});
