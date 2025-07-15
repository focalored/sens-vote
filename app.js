const express = require("express");
const mongoose = require("mongoose");
const { MONGODB_URI, PORT } = require("./utils/config");
const { info, error } = require("./utils/logger");
const { requestLogger, unknownEndpoint, errorHandler } = require("./utils/middleware");
const votingRouter = require("./routes/votingSessions");
const VotingSessionService = require("./services/VotingSessionService");

info('connecting to', MONGODB_URI)
; (async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    info('connected to MongoDB')
  } catch (e) {
    error('failed to connect to MongoDB', e.message)
  }
})()

const app = express();

// Create service instance with DB connection
const db = mongoose.connection;
const votingService = new VotingSessionService(db);

app.use(express.json());
app.use(requestLogger);

app.use("/api/sessions", votingRouter(votingService));
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
