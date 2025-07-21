const validateVotesAgainstCandidates = require('../validators/validateVotesAgainstCandidates');
const VoteCandidateValidationError = require('../errors/VoteCandidateValidationError');

describe('validateVotesAgainstCandidates', () => {
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

    expect(() => validateVotesAgainstCandidates(votes, candidates)).toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Duplicate candidates found',
      });
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

    expect(() => validateVotesAgainstCandidates(votes, candidates)).toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Duplicate votes found',
      });
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

      expect(() => validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow(VoteCandidateValidationError);
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

      expect(() => validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow(VoteCandidateValidationError);
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

      expect(() => validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Unexpected option found in candidates',
      });
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

      expect(() => validateVotesAgainstCandidates(votes, candidates, expectedOptions)).toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Unexpected option found in votes',
      });
    });
  });

  describe('when candidates are declared as people', () => {
    it('should throw if there are more votes than candidates', () => {
      const votes = [
        { candidateId: 'Alice', count: 10 },
        { candidateId: 'Bob', count: 4 },
      ];

      const candidates = ['Alice'];

      expect(() => validateVotesAgainstCandidates(votes, candidates)).toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Votes and candidates differ in count',
      });
    });

    it('should throw if there are more candidates than votes', () => {
      const votes = [
        { candidateId: 'Alice', count: 10 },
      ];

      const candidates = ['Alice', 'Bob'];

      expect(() => validateVotesAgainstCandidates(votes, candidates)).toThrow({
        name: 'VoteCandidateValidationError',
        message: 'Votes and candidates differ in count',
      });
    });

    it('should throw if a vote option is not declared in candidates', () => {
      const votes = [
        { candidateId: 'Alice', count: 10 },
        { candidateId: 'Bob', count: 4 },
      ];

      const candidates = ['Alice', 'Connor'];

      expect(() => validateVotesAgainstCandidates(votes, candidates)).toThrow(VoteCandidateValidationError);
    });
  });
});
