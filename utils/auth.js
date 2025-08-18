const jwt = require('jsonwebtoken');
const User = require('../models/User');

const {
  MissingTokenError,
  InvalidTokenError,
  ExpiredTokenError,
  NotFoundError
} = require('../errors');

const getTokenFrom = (req) => {
  const authorization = req.get('authorization') || '';

  if (authorization.startsWith('Bearer')) {
    return authorization.slice(7);
  }

  return null;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFrom(req);
    if (!token) {
      throw new MissingTokenError('Token missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ExpiredTokenError('Token expired');
      }
      throw new InvalidTokenError('Token invalid: decoding token failed');
    }

    if (!decoded || !decoded.id) {
      throw new InvalidTokenError('Token invalid: payload missing user id');
    }

    const user = await User.findById(decoded.id).select('username name sessions');
    if (!user) throw new NotFoundError(`User with id ${decoded.id} not found`);

    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authMiddleware, getTokenFrom };
