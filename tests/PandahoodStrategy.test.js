const PandahoodStrategy = require('../strategies/PandahoodStrategy');
const VoteCandidateValidationError = require('../errors/VoteCandidateValidationError');

describe('PandahoodStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new PandahoodStrategy();
  });

  describe('getResult', () => {
    it('should throw "VoteCandidateValidationError" if one of the required options is missing', () => {
      expect(() => strategy.getResult(
        [
          { candidateId: 'Yes', count: 14 },
        ],
        {
          candidates: [ 'Yes' ],
          voterCount: 20,
          roundNumber: 1,
          previousRound: null,
          evalMode: 'full',
        }
      )).toThrow(VoteCandidateValidationError);
    });

    describe('proposal round 1', () => {
      it('should return as passed if 80% or more voted yes', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Yes', count: 16 },
            { candidateId: 'No', count: 4 },
          ],
          {
            candidates: [ 'Yes', 'No' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          winners: { bucket: 'Proposal passed' },
          isComplete: true,
        });
      });

      it('should return as struck if less than 80% voted yes', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Yes', count: 15 },
            { candidateId: 'No', count: 5 },
          ],
          {
            candidates: [ 'Yes', 'No' ],
            voterCount: 20,
            roundNumber: 1,
            previousRound: null,
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          winners: { bucket: 'Proposal struck' },
          isComplete: false,
        });
      });
    });

    describe('proposal round 2', () => {
      it('should return as passed if 80% or more voted yes', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Yes', count: 16 },
            { candidateId: 'No', count: 4 },
          ],
          {
            candidates: [ 'Yes', 'No' ],
            voterCount: 20,
            roundNumber: 2,
            previousRound: {
              result: {
                winners: { bucket: 'Proposal struck' },
                isComplete: false,
              }
            },
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          winners: { bucket: 'Proposal passed' },
          isComplete: true,
        });
      });

      it('should return as struck if less than 80% voted yes', () => {
        const result = strategy.getResult(
          [
            { candidateId: 'Yes', count: 15 },
            { candidateId: 'No', count: 5 },
          ],
          {
            candidates: [ 'Yes', 'No' ],
            voterCount: 20,
            roundNumber: 2,
            previousRound: {
              result: {
                winners: { bucket: 'Proposal struck' },
                isComplete: false,
              }
            },
            evalMode: 'full',
          },
        );

        expect(result).toStrictEqual({
          winners: { bucket: 'Proposal struck' },
          isComplete: true,
        });
      });
    });
  });
});
