const getNextState = require('../../../states/sessionStateMachine');

describe('getNextState', () => {
  it('should return next state with valid action', () => {
    const result = getNextState('awaiting_moderator', 'finalizeSession');
    expect(result).toBe('complete');
  });

  it('should return null with invalid action', () => {
    const result = getNextState('awaiting_moderator', 'submitVotes');
    expect(result).toBe(null);
  });
});
