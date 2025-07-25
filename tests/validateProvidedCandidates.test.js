const validateProvidedCandidates = require('../validators/validateProvidedCandidates');
const { CandidateValidationError } = require('../errors');

describe('validateProvidedCandidates', () => {
  it('should throw if no candidates provided for 1st round', () => {
    expect(() => validateProvidedCandidates(null, 0)).toThrow({
      name: 'CandidateValidationError',
      message: 'No initial candidates provided for 1st round',
    });
  });

  it('should pass if no candidates provided for subsequent rounds', () => {
    expect(() => validateProvidedCandidates(null, 1)).not.toThrow();
  });

  it('should throw if empty candidate name found', () => {
    expect(() => validateProvidedCandidates([' ', '  '], 1)).toThrow({
      name: 'CandidateValidationError',
      message: 'Candidate names must be non-empty',
    });
  });

  it('should throw if duplicate names found', () => {
    expect(() => validateProvidedCandidates(['alice', 'Alice'], 0)).toThrow({
      name: 'CandidateValidationError',
      message: 'Duplicate candidates are not allowed',
    });
  })

  it('should pass if candidates provided valid', () => {
    const validCandidates = ['Alice', 'Bob', 'Connor'];
    expect(() => validateProvidedCandidates(validCandidates, 1)).not.toThrow();
  })
});
