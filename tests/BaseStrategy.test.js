const BaseStrategy = require('../strategies/BaseStrategy');
const VoteCandidateValidationError = require('../errors/VoteCandidateValidationError');

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

  describe('_validateVotesAgainstCandidates', () => {
    it('should throw if there are duplicate candidates', () => {
      const votes = [
        { candidateId: 'Alice', count: 10 },
        { candidateId: 'Bob', count: 4 },
        { candidateId: 'Connor', count: 5 },
      ];

      const candidates = [
        'Alice',
        'Bob',
        'Connor',
        'Connor',
      ];

      expect(() => strategy._validateVotesAgainstCandidates(votes, candidates)).toThrow(VoteCandidateValidationError);
    });

    it('should throw if there are duplicate votes', () => {
      const votes = [
        { candidateId: 'Alice', count: 10 },
        { candidateId: 'Bob', count: 4 },
        { candidateId: 'Connor', count: 5 },
        { candidateId: 'Connor', count: 5 },
      ];

      const candidates = [
        'Alice',
        'Bob',
        'Connor',
      ];

      expect(() => strategy._validateVotesAgainstCandidates(votes, candidates)).toThrow(VoteCandidateValidationError);
    });

    describe('when candidates are declared as fixed options', () => {
      it('should throw if there is an option missing in candidates', () => {
        const votes = [
          { candidateId: 'Definite callback', count: 10 },
          { candidateId: 'Maybe callback', count: 4 },
          { candidateId: 'No callback', count: 5 },
          { candidateId: 'Abstain', count: 5 },
        ];

        const candidates = [
          'Definite callback',
          'No callback',
          'Abstain',
        ];

        const expectedOptions = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain'
        ];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow(VoteCandidateValidationError);
      });

      it('should throw if there is an option missing in votes', () => {
        const votes = [
          { candidateId: 'Definite callback', count: 10 },
          { candidateId: 'No callback', count: 5 },
          { candidateId: 'Abstain', count: 5 },
        ];

        const candidates = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain',
        ];

        const expectedOptions = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain'
        ];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow(VoteCandidateValidationError);
      });

      it('should throw if there is an extra option in candidates', () => {
        const votes = [
          { candidateId: 'Definite callback', count: 10 },
          { candidateId: 'Maybe callback', count: 4 },
          { candidateId: 'No callback', count: 5 },
          { candidateId: 'Abstain', count: 5 },
        ];

        const candidates = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain',
          'Shrug',
        ];

        const expectedOptions = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain'
        ];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow(VoteCandidateValidationError);
      });
      
      it('should throw if there is an extra option in votes', () => {
        const votes = [
          { candidateId: 'Definite callback', count: 10 },
          { candidateId: 'Maybe callback', count: 4 },
          { candidateId: 'No callback', count: 5 },
          { candidateId: 'Abstain', count: 5 },
          { candidateId: 'Shrug', count: 4 },
        ];

        const candidates = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain',
        ];

        const expectedOptions = [
          'Definite callback',
          'Maybe callback',
          'No callback',
          'Abstain'
        ];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow(VoteCandidateValidationError);
      });
    });

    describe('when candidates are declared as people', () => {
      it('should throw if there are more votes than candidates', () => {
        const votes = [
          { candidateId: 'Alice', count: 10 },
          { candidateId: 'Bob', count: 4 },
        ];

        const candidates = ['Alice'];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates)).toThrow(VoteCandidateValidationError);
      });

      it('should throw if there are more candidates than votes', () => {
        const votes = [
          { candidateId: 'Alice', count: 10 },
        ];

        const candidates = ['Alice', 'Bob'];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates)).toThrow(VoteCandidateValidationError);
      });

      it('should throw if a vote option is not declared in candidates', () => {
        const votes = [
          { candidateId: 'Alice', count: 10 },
          { candidateId: 'Bob', count: 4 },
        ];

        const candidates = ['Alice', 'Connor'];

        expect(() => strategy._validateVotesAgainstCandidates(votes, candidates)).toThrow(VoteCandidateValidationError);
      });
    });
  });

  describe('determineMode', () => {
    it('should return "full"', () => {
      expect(strategy.determineMode()).toBe('full');
    });
  });

  describe('suggestNextCandidates', () => {
    it('should throw when called', () => {
      expect(() => strategy.suggestNextCandidates()).toThrow('This function should never be called in this strategy');
    });
  });

  describe('getResult', () => {
    it('should throw when called', () => {
      expect(() => strategy.getResult()).toThrow('Not implemented');
    });
  });
});
