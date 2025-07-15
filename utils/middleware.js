const { info, error } = require('./logger');

const requestLogger = (req, res, next) => {
  info('Method:', req.method);
  info('Path:', req.path);
  info('Body:', req.body);
  info('---');
  next()
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'Unknown endpoint' });
};

const errorHandler = (error, req, res, next) => {
  error(error.message);

  if (error.name === 'ValidationError') {
    return res.status(400).send({ error: error.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler
};