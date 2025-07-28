const getDefaultCandidatesForStrategy = require('../../../utils/getDefaultCandidatesForStrategy');

describe('getDefaultCandidatesForStrategy', () => {
  it('should return expected options for "callback"', () => {
    const { candidates, candidateType } = getDefaultCandidatesForStrategy('callback');
    expect(candidates).toStrictEqual(['Definite callback', 'Maybe callback', 'No callback', 'Abstain']);
    expect(candidateType).toBe('options');
  });

  it('should return expected options for "pandahood"', () => {
    const { candidates, candidateType } = getDefaultCandidatesForStrategy('pandahood');
    expect(candidates).toStrictEqual(['Yes', 'No']);
    expect(candidateType).toBe('options');
  });

  it('should return null otherwise', () => {
    const { candidates, candidateType } = getDefaultCandidatesForStrategy('solo');
    expect(candidates).toStrictEqual(null);
    expect(candidateType).toBe('names');
  });
});
