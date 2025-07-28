const guardState = require('../../../states/guardState');
const { SessionStatusError } = require('../../../errors');

describe('guardState', () => {
  it('should pass if valid state', () => {
    expect(() => guardState({ status: 'draft' }, 'draft')).not.toThrow();
  });

  it('should throw if invalid state', () => {
    expect(() => guardState({ status: 'draft' }, 'awaiting_votes')).toThrow(SessionStatusError);
  });
});
