const CallbackStrategy = require('../strategies/CallbackStrategy');

describe('CallbackStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new CallbackStrategy();
  });

  describe('getResult', () => {
    describe('round 1 - day of audition', () => {
      it('should return no callback if less than 40% voted definite or maybe', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Definite callback', count: 1 },
            { candidateId: 'Maybe callback', count: 6 },
            { candidateId: 'No callback', count: 10 },
            { candidateId: 'Abstain', count: 3 },
          ],
          {
            candidates: [ 'Definite callback', 'Maybe callback', 'No callback', 'Abstain' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'callback',
          winners: { bucket: 'No callback' },
          isComplete: true,
        });
      });

      it('should return definite callback if 80% or more voted definite', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Definite callback', count: 16 },
            { candidateId: 'Maybe callback', count: 4 },
            { candidateId: 'No callback', count: 0 },
            { candidateId: 'Abstain', count: 0 },
          ],
          {
            candidates: [ 'Definite callback', 'Maybe callback', 'No callback', 'Abstain' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'callback',
          winners: { bucket: 'Definite callback' },
          isComplete: true,
        });
      });

      it('should return possible callback and incomplete session otherwise', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Definite callback', count: 4 },
            { candidateId: 'Maybe callback', count: 4 },
            { candidateId: 'No callback', count: 10 },
            { candidateId: 'Abstain', count: 2 },
          ],
          {
            candidates: [ 'Definite callback', 'Maybe callback', 'No callback', 'Abstain' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'callback',
          winners: { bucket: 'Possible callback' },
          isComplete: false,
        });
      });
    });

    describe('possible callbacks extra round - last day of auditions', () => {
      it('should return no callback if less than 40% voted definite or maybe', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Definite callback', count: 4 },
            { candidateId: 'Maybe callback', count: 3 },
            { candidateId: 'No callback', count: 10 },
            { candidateId: 'Abstain', count: 3 },
          ],
          {
            candidates: [ 'Definite callback', 'Maybe callback', 'No callback', 'Abstain' ],
            voterCount: 20,
            roundNumber: 2,
            previousRound: {
              result: {
                type: 'callback',
                winners: { bucket: 'Possible callback' },
                isComplete: false,
              }
            },            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'callback',
          winners: { bucket: 'No callback' },
          isComplete: true,
        });
      });

      it('should return definite callback if 80% or more voted definite', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Definite callback', count: 16 },
            { candidateId: 'Maybe callback', count: 4 },
            { candidateId: 'No callback', count: 0 },
            { candidateId: 'Abstain', count: 0 },
          ],
          {
            candidates: [ 'Definite callback', 'Maybe callback', 'No callback', 'Abstain' ],
            voterCount: 20,
            roundNumber: 2,
            previousRound: {
              result: {
                type: 'callback',
                winners: { bucket: 'Possible callback' },
                isComplete: false,
              }
            },            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'callback',
          winners: { bucket: 'Definite callback' },
          isComplete: true,
        });
      });

      it('should return possible callback and completed session otherwise', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Definite callback', count: 4 },
            { candidateId: 'Maybe callback', count: 4 },
            { candidateId: 'No callback', count: 10 },
            { candidateId: 'Abstain', count: 2 },
          ],
          {
            candidates: [ 'Definite callback', 'Maybe callback', 'No callback', 'Abstain' ],
            voterCount: 20,
            roundNumber: 2,
            previousRound: {
              result: {
                type: 'callback',
                winners: { bucket: 'Possible callback' },
                isComplete: false,
              }
            },
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          type: 'callback',
          winners: { bucket: 'Possible callback' },
          isComplete: true,
        });
      });
    });
  });
});
