const express = require("express");
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./utils/config");
const { info, error } = require("./utils/logger");
const {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} = require("./utils/middleware");

const usersRouter = require('./controllers/users');
const loginRouter = require('./controllers/login');
const votingSessionsRouter = require("./controllers/votingSessions");
const VotingService = require("./services/VotingService");

const { authMiddleware } = require('./utils/auth');

info("connecting to", MONGODB_URI);
(async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    info("connected to MongoDB");
  } catch (e) {
    error("failed to connect to MongoDB", e.message);
  }
})();

const app = express();

app.use(express.json());
app.use(requestLogger);

const votingService = new VotingService();

app.use("/api/sessions", authMiddleware, votingSessionsRouter(votingService));
app.use('/api/users', usersRouter);
app.use('/api/login', loginRouter);
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
