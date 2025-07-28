const mongoose = require('mongoose');
const zodMiddleware = require('../../../utils/zodMiddleware');
const startSessionSchema = require('../../../schemas/startSessionSchema');
const { sessionAndRoundIdParams } = require('../../../schemas/objectIdSchema');

describe('zodMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();
  });

  it('should call next() when both params and body passed', () => {
    req.body = {
      type: 'solo',
      candidates: ['Alice'],
      voterCount: 1,
    };
    req.params = {
      sessionId: new mongoose.Types.ObjectId().toString(),
      roundId: new mongoose.Types.ObjectId().toString(),
    }

    const middleware = zodMiddleware({ body: startSessionSchema, params: sessionAndRoundIdParams });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next() when only body passed', () => {
    req.body = {
      type: 'solo',
      candidates: ['Alice'],
      voterCount: 1,
    };

    const middleware = zodMiddleware({ body: startSessionSchema });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next() when only params passed', () => {
    req.params = {
      sessionId: new mongoose.Types.ObjectId().toString(),
      roundId: new mongoose.Types.ObjectId().toString(),
    }

    const middleware = zodMiddleware({ params: sessionAndRoundIdParams });

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
