const logger = require('../../../utils/logger');
const {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} = require('../../../utils/middleware');

const {
  DomainError,
  ValidationError,
  NotFoundError,
} = require('../../../errors');

describe('requestLogger', () => {
  let mockReq = {};
  let mockRes = {};
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  })

  it('should log metheod, path, and body and call next', () => {
    const mockReq = { method: 'GET', path: '/api/test', body: { foo: 'bar' }};
    const mockRes = {};
    const mockNext = jest.fn();

    requestLogger(mockReq, mockRes, mockNext);

    expect(logger.info).toHaveBeenCalledWith('Method:', 'GET');
    expect(logger.info).toHaveBeenCalledWith('Path:', '/api/test');
    expect(logger.info).toHaveBeenCalledWith('Body:', { foo: 'bar' });
    expect(logger.info).toHaveBeenCalledWith('---');

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});

describe('unknownEndpoint', () => {
  it('should return "Unknown endpoint" with 404 if called', async () => {
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await unknownEndpoint(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unknown endpoint' });
  });
});

describe('errorHandler', () => {
  let mockReq = {};
  let mockRes = {};
  const mockNext = jest.fn();
  
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return with status 400 if CastError', async () => {
    const err = { name: 'CastError' };

    await errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Malformatted session ID'});
  });

  it('should return with status 400 if ValidationError', async () => {
    const err = new ValidationError('boo');

    await errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'boo'});
  });

  it('should return with status 409 if DomainError', async () => {
    const err = new DomainError('boo');

    await errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'boo'});
  });

  it('should return with status 404 if NotFoundError', async () => {
    const err = new NotFoundError('boo');

    await errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'boo'});
  });

  it('should call next with error if unknown error', async () => {
    const err = new Error('Unknown Error');

    await errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });
});
