const handleController = require('../../../utils/handleController');

describe('handleController', () => {
  it('should call next with error if server throws', async () => {
    const mockHandler = jest.fn().mockRejectedValue(new Error('snap'));
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();

    await (handleController(mockHandler))(mockReq, mockRes, mockNext);

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});