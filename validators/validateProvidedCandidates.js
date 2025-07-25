const { CandidateValidationError } = require('../errors');

function validateProvidedCandidates(candidates, previousRoundCount) {
  if (!candidates) {
    if (previousRoundCount === 0) throw new CandidateValidationError('No initial candidates provided for 1st round');
    return; 
  }

  const normalized = candidates.map((c) => {
    if (!c.trim()) {
      throw new CandidateValidationError('Candidate names must be non-empty');
    }
    return c.trim().toLowerCase();
  });
  
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    throw new CandidateValidationError('Duplicate candidates are not allowed');
  }

}

module.exports = validateProvidedCandidates;
