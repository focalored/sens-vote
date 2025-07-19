module.exports = (votingService) => {
  const router = require("express").Router();

  router.get("/", async (req, res, next) => {
    const sessions = await votingService.getSessions();
    res.json(sessions);
  });

  router.post("/", async (req, res, next) => {
    const session = await votingService.createSession();
    res.status(201).json(session);
  });

  router.get("/:sessionId", async (req, res, next) => {
    const session = await votingService.getSession(req.params.sessionId);
    res.json(session);
  });

  router.post("/:sessionId/start", async (req, res, next) => {
    const session = await votingService.startSession(
      req.params.sessionId,
      req.body,
    );
    res.json(session);
  });

  router.post("/:sessionId/next", async (req, res, next) => {
    const createdRound = await votingService.advanceToNextRound(
      req.params.sessionId,
      req.body.providedCandidates,
    );
    res.json(createdRound);
  });

  router.get("/:sessionId/rounds/:roundId", async (req, res, next) => {
    const round = await votingService.getRound(sessionId, roundId);
    res.send(round);
  });

  router.post("/:sessionId/rounds/:roundId/vote", async (req, res, next) => {
    const finalizedRound = await votingService.submitVotes(
      req.params.sessionId,
      req.params.roundId,
      req.body.votes,
    );
    res.json(finalizedRound);
  });

  router.post("/:sessionId/finalize", async (req, res, next) => {
    const session = await votingService.finalizeRound(req.params.sessionId);
    res.json(session);
  });

  return router;
};
