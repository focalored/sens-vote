const startSessionSchema = require('../../../schemas/startSessionSchema');
const zodMiddleware = require('../../../utils/zodMiddleware');
const { ZodError } = require('zod');

describe('startSessionSchema', () => {
  it('should pass with valid input', () => {
    const body = {
      type: 'solo',
      candidates: ['Alice', 'Bob', 'Connor', 'Diana'],
      voterCount: 20,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).not.toThrow();
  });

  it('should pass without optional inputs', () => {
    const body = {
      type: 'solo',
      candidates: ['Alice', 'Bob', 'Connor', 'Diana'],
      voterCount: 20,
    };

    expect(() => startSessionSchema.parse(body)).not.toThrow();
  });

  it('should throw if type is null', () => {
    const body = {
      type: null,
      candidates: ['Alice', 'Bob', 'Connor', 'Diana'],
      voterCount: 20,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if type invalid', () => {
    const body = {
      type: 'invalid',
      candidates: ['Alice', 'Bob', 'Connor', 'Diana'],
      voterCount: 20,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if candidates is null', () => {
    const body = {
      type: 'solo',
      candidates: null,
      voterCount: 20,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if candidates empty', () => {
    const body = {
      type: 'solo',
      candidates: [],
      voterCount: 20,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if candidates contain non-string values', () => {
    const body = {
      type: 'solo',
      candidates: ['Alice', 'Bob', 13],
      voterCount: 20,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if voterCount is null', () => {
    const body = {
      type: 'solo',
      candidates: ['Alice', 'Bob', 'Connor', 'Diana'],
      voterCount: null,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });

  it('should throw if voterCount is below 1', () => {
    const body = {
      type: 'solo',
      candidates: ['Alice', 'Bob', 'Connor', 'Diana'],
      voterCount: 0,
      song: 'Mirrors',
    };

    expect(() => startSessionSchema.parse(body)).toThrow(ZodError);
  });
});
