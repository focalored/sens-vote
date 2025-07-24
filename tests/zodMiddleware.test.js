const zodMiddleware = require('../utils/zodMiddleware');
const startSessionSchema = require('../schemas/startSessionSchema');

describe('zodMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();
  });

  it('should call next() on valid input', () => {
    req.body = {
      type: 'solo',
      candidates: ['Alice'],
      voterCount: 1,
    };

    const middleware = zodMiddleware({ body: startSessionSchema });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('calls next(err) on invalid input', () => {
    req.body = {
      type: 'invalid',
      candidates: [],
      voterCount: 0,
    };

    const middleware = zodMiddleware({ body: startSessionSchema });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ZodValidationError');
  });
});
