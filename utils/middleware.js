const {
  ValidationError,
  DomainError,
  NotFoundError,
} = require('../errors');

const logger = require("./logger");

const requestLogger = (req, res, next) => {
  logger.info("Method:", req.method);
  logger.info("Path:", req.path);
  logger.info("Body:", req.body);
  logger.info("---");
  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: "Unknown endpoint" });
};

const errorHandler = (error, req, res, next) => {
  logger.error(error.message);
  
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Malformatted session ID' });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.errors || error.message });
  }
  if (error instanceof DomainError) {
    return res.status(409).json({ error: error.message });
  }
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  next(error);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
};
