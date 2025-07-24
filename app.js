const express = require("express");
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./utils/config");
const { info, error } = require("./utils/logger");
const {
  requestLogger,
  unknownEndpoint,
  errorHandler,
} = require("./utils/middleware");
const votingRouter = require("./controllers/votingSessions");
const VotingService = require("./services/VotingService");

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

app.use("/api/sessions", votingRouter(votingService));
app.use(unknownEndpoint);
app.use(errorHandler);

module.exports = app;
