module.exports = (votingService) => {
  const router = require("express").Router();
  const VotingSession = require("../models/VotingSession");

  // Get all voting sessions
  router.get("/", async (req, res, next) => {
    try {
      const sessions = await VotingSession.find({});
      res.json(sessions);
    } catch (e) {
      next(e);
    }
  });

  // Create new voting session
  router.post("/", async (req, res, next) => {
    try {
      const session = await votingService.createSession(req.body);
      res.status(201).json(session);
    } catch (e) {
      next(e);
    }
  });

  // Get specific voting session with rounds
  router.get("/:id", async(req, res, next) => {
    try {
      const session = await VotingSession.findById(req.params.id);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (e) {
      next(e);
    }
  });

  // Add round to current session
  router.post("/:id/rounds", async (req, res, next) => {
    try {
      const session = await VotingSession.findById(req.params.id);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
      }

      const candidates = req.body.candidates ?? undefined;
      
      const latestRound = await votingService.addRound(session._id, req.body.votes, candidates);

      res.status(200).json(latestRound);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
