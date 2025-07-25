const advanceRoundSchema = require('../schemas/advanceRoundSchema');
const zodMiddleware = require('../utils/zodMiddleware');
const { ZodError } = require('zod');

describe('advanceRoundSchema', () => {
  it('should pass with valid input', () => {
    const body = {
      providedCandidates: ['Alice', 'Bob'],
    };

    expect(() => advanceRoundSchema.parse(body)).not.toThrow();
  });

  it('should pass with absent input', () => {
    const body = {};

    expect(() => advanceRoundSchema.parse(body)).not.toThrow();
  });

  it('should throw if array is empty', () => {
    const body = {
      providedCandidates: [],
    };

    expect(() => advanceRoundSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if array contains non-string values', () => {
    const body = {
      providedCandidates: [1, 2, 3],
    };

    expect(() => advanceRoundSchema.parse(body)).toThrow(ZodError);
  });
});
