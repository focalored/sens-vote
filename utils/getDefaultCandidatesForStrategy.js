function getDefaultCandidatesForStrategy(type) {
  switch (type) {
    case 'callback':
      return {
        candidates: ['Definite callback', 'Maybe callback', 'No callback', 'Abstain'],
        candidateType: 'options',
      };
    case 'pandahood':
      return {
        candidates: ['Yes', 'No'],
        candidateType: 'options',
      };

    default:
      return {
        candidates: null,
        candidateType: 'names',
      }
  }
}

module.exports = getDefaultCandidatesForStrategy;
