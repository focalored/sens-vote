const submitVotesSchema = require('../../../schemas/submitVotesSchema');
const zodMiddleware = require('../../../utils/zodMiddleware');
const { ZodError } = require('zod');

describe('submitVotesSchema', () => {
  it('should pass with valid input', () => {
    const body = {
      votes: [
        { candidateId: 'Alice', count: 10 },
        { candidateId: 'Bob', count: 4 },
      ],
    };

    expect(() => submitVotesSchema.parse(body)).not.toThrow();
  });

  it('should throw if votes is null', () => {
    const body = {
      votes: null,
    };

    expect(() => submitVotesSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if a candidateId is null', () => {
    const body = {
      votes: [
        { candidateId: null, count: 10 },
        { candidateId: 'Bob', count: 4 },
      ],
    };

    expect(() => submitVotesSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if a candidateId is invalid', () => {
    const body = {
      votes: [
        { candidateId: 14, count: 10 },
        { candidateId: 'Bob', count: 4 },
      ],
    };

    expect(() => submitVotesSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if a count is null', () => {
    const body = {
      votes: [
        { candidateId: 'Alice', count: null },
        { candidateId: 'Bob', count: 4 },
      ],
    };

    expect(() => submitVotesSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if a count is invalid', () => {
    const body = {
      votes: [
        { candidateId: 'Alice', count: 'a' },
        { candidateId: 'Bob', count: 4 },
      ],
    };

    expect(() => submitVotesSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if a count is below 0', () => {
    const body = {
      votes: [
        { candidateId: 'Alice', count: -1 },
        { candidateId: 'Bob', count: 4 },
      ],
    };

    expect(() => submitVotesSchema.parse(body)).toThrow(ZodError);
  });
});
