const ExecStrategy = require('../strategies/ExecStrategy');

describe('ExecStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new ExecStrategy();
  });

  describe('getResult', () => {
    describe('round 1', () => {
      it('should return top candidate if 75% threshold is met', () => {
        const { result } = strategy.getResult(
          [
            { candidateId: 'Alice', count: 15 },
            { candidateId: 'Bob', count: 4 },
          ],
          {
            candidates: [ 'Alice', 'Bob' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'exec',
          winners: { role: 'Alice' },
          isComplete: true,
        });
      });

      it('should return no candidate if 75% threhold is not met', () => {
        const { result } = strategy.getResult(
          [
            { candidateId: 'Alice', count: 14 },
            { candidateId: 'Bob', count: 6 },
          ],
          {
            candidates: [ 'Alice', 'Bob' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'exec',
          winners: { role: null },
          isComplete: false,
        });
      });
    });

    describe('round 2', () => {
      describe('when there is only one candidate', () => {
        it('should return candidate if 50% threshold is met', () => {
          const { result } = strategy.getResult(
            [
              { candidateId: 'Alice', count: 10 },
            ],
            {
              candidates: [ 'Alice' ],
              voterCount: 20,
              roundNumber: 2,
              previousRound: {
                result: {
                  type: 'exec',
                  winners: { role: null },
                  isComplete: false,
                }
              },
              evalMode: 'full',
            },
          );

          expect(result).toStrictEqual({
            type: 'exec',
            winners: { role: 'Alice' },
            isComplete: true,
          });
        });

        it('should return no candidate if 50% threshold is not met', () => {
          const { result } = strategy.getResult(
            [
              { candidateId: 'Alice', count: 9 },
            ],
            {
              candidates: [ 'Alice' ],
              voterCount: 20,
              roundNumber: 2,
              previousRound: {
                result: {
                  type: 'exec',
                  winners: { role: null },
                  isComplete: false,
                }
              },
              evalMode: 'full',
            },
          );

          expect(result).toStrictEqual({
            type: 'exec',
            winners: { role: null },
            isComplete: false,
          });
        });
      });

      describe('when there are multiple candidates', () => {
        it('should return top candidate if 50% and +2 thresholds are met', () => {
          const { result } = strategy.getResult(
            [
              { candidateId: 'Alice', count: 10 },
              { candidateId: 'Bob', count: 8 },
            ],
            {
              candidates: [ 'Alice', 'Bob' ],
              voterCount: 20,
              roundNumber: 2,
              previousRound: {
                result: {
                  type: 'exec',
                  winners: { role: null },
                  isComplete: false,
                }
              },
              evalMode: 'full',
            },
          );

          expect(result).toStrictEqual({
            type: 'exec',
            winners: { role: 'Alice' },
            isComplete: true,
          });
        });

        it('should return no candidate if 50% threshold is met but not +2 threshold', () => {
          const { result } = strategy.getResult(
            [
              { candidateId: 'Alice', count: 10 },
              { candidateId: 'Bob', count: 9 },
            ],
            {
              candidates: [ 'Alice', 'Bob' ],
              voterCount: 20,
              roundNumber: 2,
              previousRound: {
                result: {
                  type: 'exec',
                  winners: { role: null },
                  isComplete: false,
                }
              },
              evalMode: 'full',
            },
          );

          expect(result).toStrictEqual({
            type: 'exec',
            winners: { role: null },
            isComplete: false,
          });
        });

        it('should return no candidate if neither threshold is met', () => {
          const { result } = strategy.getResult(
            [
              { candidateId: 'Alice', count: 9 },
              { candidateId: 'Bob', count: 9 },
            ],
            {
              candidates: [ 'Alice', 'Bob' ],
              voterCount: 20,
              roundNumber: 2,
              previousRound: {
                result: {
                  type: 'exec',
                  winners: { role: null },
                  isComplete: false,
                }
              },
              evalMode: 'full',
            },
          );

          expect(result).toStrictEqual({
            type: 'exec',
            winners: { role: null },
            isComplete: false,
          });
        });
      });
    });

    describe('round 3', () => {
      it('should return top candidate if 50% threshold is met', () => {
        const { result } = strategy.getResult(
          [
            { candidateId: 'Alice', count: 10 },
            { candidateId: 'Bob', count: 9 },
          ],
          {
            candidates: [ 'Alice', 'Bob' ],
            voterCount: 20,
            roundNumber: 3,
            previousRound: {
              result: {
                type: 'exec',
                winners: { role: null },
                isComplete: false,
              }
            },
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'exec',
          winners: { role: 'Alice' },
          isComplete: true,
        });
      });

      it('should return no candidate and isComplete if threshold is not met', () => {
        const { result } = strategy.getResult(
          [
            { candidateId: 'Alice', count: 9 },
            { candidateId: 'Bob', count: 9 },
          ],
          {
            candidates: [ 'Alice', 'Bob' ],
            voterCount: 20,
            roundNumber: 3,
            previousRound: {
              result: {
                type: 'exec',
                winners: { role: null },
                isComplete: false,
              }
            },
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'exec',
          winners: { role: null },
          isComplete: true,
        });
      });
    });
  });
});
