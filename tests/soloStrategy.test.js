const SoloStrategy = require("../strategies/SoloStrategy");

describe('SoloStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new SoloStrategy();
  });

  describe('determineMode', () => {
    it('should return "full" if no previous round exists', () => {
      expect(strategy.determineMode(null)).toBe('full');
    });

    it('should return "full" if neither soloist nor understudy is chosen', () => {
      expect(strategy.determineMode({ result: {
        winners: {
          soloist: null,
          understudy: null,
        },
        isComplete: false,
      } })).toBe('full');
    });

    it('should return "full" if both soloist and understudy are chosen', () => {
      expect(strategy.determineMode({ result: {
        winners: {
          soloist: 'Alice',
          understudy: 'Bob',
        },
        isComplete: true,
      } })).toBe('full');
    });

    it('should return "understudy_only" if soloist is chosen but not understudy', () => {
      expect(strategy.determineMode({ result: {
        winners: {
          soloist: 'Alice',
          understudy: null,
        },
        isComplete: false,
      } })).toBe('understudy_only');
    });

    // Won't ever encounter this phantom case...
    // if previousRound.isComplete === true, RoundInitializer should not call determineMode
    it('should return "understudy_only" if soloist is chosen and there are no additional candidates for understudy', () => {
      expect(strategy.determineMode({ result: {
        winners: {
          soloist: 'Alice',
          understudy: null,
        },
        isComplete: true,
      } })).toBe('understudy_only');
    });
  });

  describe('suggestCandidates', () => {
    describe('when evalMode is "understudy_only"', () => {
      it('should return nonsoloist candidates tied at the top for 1st understudy tiebreaker', () => {
        expect(strategy.suggestCandidates(
          {
            votes: [
              { candidateId: 'Alice', count: 10 },
              { candidateId: 'Bob', count: 5 },
              { candidateId: 'Connor', count: 5 },
              { candidateId: 'Diana', count: 3 },
            ],
            result: {
              winners: {
                soloist: 'Alice',
                understudy: null,
              },
              isComplete: false,
            },
          },
          'understudy_only'
        )).toStrictEqual([
          'Bob',
          'Connor'
        ]);
      });

      it('should return nonsoloist candidates tied at the top for subsequent understudy tiebreakers', () => {
        expect(strategy.suggestCandidates(
          {
            votes: [
              { candidateId: 'Alice', count: 8 },
              { candidateId: 'Bob', count: 8 },
              { candidateId: 'Connor', count: 7 },
            ],
            result: {
              winners: {
                soloist: 'Diana',
                understudy: null,
              },
              isComplete: false,
            },
          },
          'understudy_only'
        )).toStrictEqual([
          'Alice',
          'Bob'
        ]);
      });
      
      it('should throw "NoUnderstudyCandidatesError" if only soloist is present in previousRound votes', () => {
        expect(() => strategy.suggestCandidates(
          {
            votes: [
              { candidateId: 'Alice', count: 10 },
            ],
            result: {
              winners: {
                soloist: 'Alice',
                understudy: null,
              },
              isComplete: false,
            },
          },
          'understudy_only'
        )).toThrow({
          name: 'NoUnderstudyCandidatesError',
          message: 'No non-soloist candidates found for understudy round',
        });
      });
    });

    describe('when evalMode is "full"', () => {
      it('should return top candidates within 2 votes of each other', () => {
        expect(strategy.suggestCandidates(
          {
            votes: [
              { candidateId: 'Alice', count: 7 },
              { candidateId: 'Bob', count: 8 },
              { candidateId: 'Connor', count: 5 },
            ],
            result: {
              winners: {
                soloist: null,
                understudy: null,
              },
              isComplete: false,
            },
          },
          'full'
        )).toStrictEqual([
          'Alice',
          'Bob',
        ]);
      });

      it('should return top candidates within 2 votes of each other - multiple ties', () => {
        expect(strategy.suggestCandidates(
          {
            votes: [
              { candidateId: 'Alice', count: 5 },
              { candidateId: 'Bob', count: 4 },
              { candidateId: 'Connor', count: 4 },
              { candidateId: 'Diana', count: 5 },
              { candidateId: 'Eric', count: 2 },
            ],
            result: {
              winners: {
                soloist: null,
                understudy: null,
              },
              isComplete: false,
            },
          },
          'full'
        )).toStrictEqual([
          'Alice',
          'Bob',
          'Connor',
          'Diana',
        ]);
      });
    });
  });

  describe('getResult', () => {
    it('should throw "InvalidVotesDataError" if votes array is empty', () => {
      expect(() => strategy.getResult(
        [],
        {
          candidates: [ 'Alice' ],
          voterCount: 20,
          roundNumber: 1,
          previousRound: null,
          evalMode: 'full'
        }
      )).toThrow({
        name: 'InvalidVotesDataError',
        message: 'Insufficient vote data to get round results'
      });
    });

    // What if lengths match but not candidateIds? Who is in charge of handling?
    it('should throw "VoteCandidateMismatchError" if votes and candidates arrays have different lengths', () => {
      expect(() => strategy.getResult(
        [
          { candidateId: 'Alice', count: 5 }
        ],
        {
          candidates: [ 'Alice', 'Bob' ],
        }
      )).toThrow({
        name: 'VoteCandidateMismatchError',
        message: 'Votes and candidates length mismatch'
      });
    });

    describe('when evalMode is "understudy_only"', () => {
      it('should return soloist and understudy when first has more votes than second', () => {
        const result = strategy.getResult(
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
                winners: { soloist: 'Connor', understudy: null },
                isComplete: false,
              },
            },
            evalMode: 'understudy_only',
          }
        )
        
        expect(result).toStrictEqual({
          winners: { soloist: 'Connor', understudy: 'Alice' },
          isComplete: true,
        });
      });

      it('should return soloist and no understudy when tied', () => {
        const result = strategy.getResult(
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
                winners: { soloist: 'Connor', understudy: null },
                isComplete: false,
              },
            },
            evalMode: 'understudy_only',
          }
        )
        
        expect(result).toStrictEqual({
          winners: { soloist: 'Connor', understudy: null },
          isComplete: false,
        });
      });
    });

    describe('when evalMode is "full"', () => {
      describe('when there is only one candidate', () => {
        it('should return that candidate as soloist if 50% threshold met', () => {
          const result = strategy.getResult(
            [
              { candidateId: 'Alice', count: 10 }
            ],
            {
              candidates: [ 'Alice' ],
              voterCount: 20,
              roundNumber: 1,
              previousRound: null,
              evalMode: 'full',
            }
          );

          expect(result).toStrictEqual({
            winners: { soloist: 'Alice', understudy: null },
            isComplete: true,
          });
        });

        it('should return no soloist if 50% threshold not met', () => {
          const result = strategy.getResult(
            [
              { candidateId: 'Alice', count: 9 }
            ],
            {
              candidates: [ 'Alice' ],
              voterCount: 20,
              roundNumber: 1,
              previousRound: null,
              evalMode: 'full',
            }
          );

          expect(result).toStrictEqual({
            winners: { soloist: null, understudy: null },
            isComplete: false,
          });
        });
      });

      describe('when there is more than one candidate', () => {
        describe('when roundNumber < 4', () => {
          it('should return soloist and understudy if threshold is met and no runner-up ties', () => {
            const result = strategy.getResult(
              [
                { candidateId: 'Alice', count: 8 },
                { candidateId: 'Bob', count: 6 },
                { candidateId: 'Connor', count: 5 },
              ],
              {
                candidates: [ 'Alice', 'Bob', 'Connor' ],
                voterCount: 20,
                roundNumber: 1,
                previousRound: null,
                evalMode: 'full',
              }
            );

            expect(result).toStrictEqual({
              winners: { soloist: 'Alice', understudy: 'Bob' },
              isComplete: true,
            });
          });

          it('should return soloist and no understudy if threshold is met but runner-ups are tied', () => {
            const result = strategy.getResult(
              [
                { candidateId: 'Alice', count: 8 },
                { candidateId: 'Bob', count: 6 },
                { candidateId: 'Connor', count: 6 },
              ],
              {
                candidates: [ 'Alice', 'Bob', 'Connor' ],
                voterCount: 20,
                roundNumber: 2,
                previousRound: {
                  result: {
                    winners: { soloist: null, understudy: null },
                    isComplete: false,
                  },
                },
                evalMode: 'full',
              }
            );

            expect(result).toStrictEqual({
              winners: { soloist: 'Alice', understudy: null },
              isComplete: false,
            });
          });

          it('should return no soloist or understudy if threshold is not met', () => {
            const result = strategy.getResult(
              [
                { candidateId: 'Alice', count: 7 },
                { candidateId: 'Bob', count: 6 },
                { candidateId: 'Connor', count: 2 },
              ],
              {
                candidates: [ 'Alice', 'Bob', 'Connor' ],
                voterCount: 20,
                roundNumber: 3,
                previousRound: {
                  result: {
                    winners: { soloist: null, understudy: null },
                    isComplete: false,
                  }
                },
                evalMode: 'full',
              }
            );

            expect(result).toStrictEqual({
              winners: { soloist: null, understudy: null },
              isComplete: false,
            });
          });
        });

        describe('when roundNumber >= 4', () => {
          it('should return soloist and understudy if first > second and no runner-up ties', () => {
            const result = strategy.getResult(
              [
                { candidateId: 'Alice', count: 9 },
                { candidateId: 'Bob', count: 8 },
                { candidateId: 'Connor', count: 2 },
              ],
              {
                candidates: [ 'Alice', 'Bob', 'Connor' ],
                voterCount: 20,
                roundNumber: 4,
                previousRound: {
                  result: {
                    winners: { soloist: null, understudy: null },
                    isComplete: false,
                  },
                },
                evalMode: 'full',
              }
            );

            expect(result).toStrictEqual({
              winners: { soloist: 'Alice', understudy: 'Bob' },
              isComplete: true,
            });
          });

          it('should return soloist and no understudy if first > second but runner-ups tied', () => {
            const result = strategy.getResult(
              [
                { candidateId: 'Alice', count: 7 },
                { candidateId: 'Bob', count: 6 },
                { candidateId: 'Connor', count: 6 },
              ],
              {
                candidates: [ 'Alice', 'Bob', 'Connor' ],
                voterCount: 20,
                roundNumber: 4,
                previousRound: {
                  result: {
                    winners: { soloist: null, understudy: null },
                    isComplete: false,
                  },
                },
                evalMode: 'full',
              }
            );

            expect(result).toStrictEqual({
              winners: { soloist: 'Alice', understudy: null },
              isComplete: false,
            });
          });

          it('should return no soloist or understudy if first place is tied', () => {
            const result = strategy.getResult(
              [
                { candidateId: 'Alice', count: 6 },
                { candidateId: 'Bob', count: 6 },
                { candidateId: 'Connor', count: 6 },
              ],
              {
                candidates: [ 'Alice', 'Bob', 'Connor' ],
                voterCount: 20,
                roundNumber: 4,
                previousRound: {
                  result: {
                    winners: { soloist: null, understudy: null },
                    isComplete: false,
                  },
                },
                evalMode: 'full',
              }
            );

            expect(result).toStrictEqual({
              winners: { soloist: null, understudy: null },
              isComplete: false,
            });
          });
        });
      });
    });

  });
});
