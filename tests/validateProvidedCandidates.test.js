const validateProvidedCandidates = require('../validators/validateProvidedCandidates');
const { CandidateValidationError } = require('../errors');

describe('validateProvidedCandidates', () => {
  it('should throw if no candidates provided for 1st round', () => {
    expect(() => validateProvidedCandidates(null, 0)).toThrow(CandidateValidationError);
  });

  it('should pass if no candidates provided for subsequent rounds', () => {
    expect(() => validateProvidedCandidates(null, 1)).not.toThrow();
  });

  it('should throw if empty candidate name found', () => {
    expect(() => validateProvidedCandidates([' ', '  '], 1)).toThrow(CandidateValidationError);
  });

  it('should throw if duplicate names found', () => {
    expect(() => validateProvidedCandidates(['alice', 'Alice'], 0)).toThrow(CandidateValidationError);
  })
});
