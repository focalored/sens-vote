module.exports = (votingService) => {
  const router = require('express').Router();
  const handleController = require('../utils/handleController');
  const zodMiddleware = require('../utils/zodMiddleware');
  const startSessionSchema = require('../schemas/startSessionSchema');
  const advanceRoundSchema = require('../schemas/advanceRoundSchema');
  const submitVotesSchema = require('../schemas/submitVotesSchema');
  const {
    sessionIdParam,
    sessionAndRoundIdParams,
    objectIdSchema,
  } = require('../schemas/objectIdSchema');
  const User = require('../models/User');

  router.get(
    "/",
    handleController(async (req, res, next) => {
      const sessions = await votingService.getSessions(req.userId);
      res.json(sessions);
    })
  );

  router.get(
    "/:sessionId",
    zodMiddleware({ params: sessionIdParam }),
    handleController(async (req, res, next) => {
      const session = await votingService.getSession(
        req.validatedParams.sessionId,
        req.userId,
      );
      res.json(session);
    })
  );
  
  router.get(
    "/:sessionId/rounds/:roundId",
    zodMiddleware({ params: sessionAndRoundIdParams }),
    handleController(async (req, res, next) => {
      const round = await votingService.getRound(
        req.validatedParams.sessionId,
        req.validatedParams.roundId,
        req.userId,
      );
      res.json(round);
    })
  );

  router.post(
    "/",
    handleController(async (req, res, next) => {
      const session = await votingService.createSession(req.userId);

      await User.findByIdAndUpdate(req.userId, { $push: { sessions: session._id }});

      res.status(201).json(session);
    })
  );

  router.post(
    "/:sessionId/start",
    zodMiddleware({ body: startSessionSchema, params: sessionIdParam }),
    handleController(async (req, res, next) => {
      const session = await votingService.startSession(
        req.validatedParams.sessionId,
        req.userId,
        req.validatedBody,
      );
      res.json(session);
    })
  );

  router.post(
    "/:sessionId/next",
    zodMiddleware({ body: advanceRoundSchema, params: sessionIdParam }),
    handleController(async (req, res, next) => {
      const createdRound = await votingService.advanceToNextRound(
        req.validatedParams.sessionId,
        req.userId,
        req.validatedBody.providedCandidates,
      );
      res.json(createdRound);
    })
  );

  router.post(
    "/:sessionId/rounds/:roundId/vote",
    zodMiddleware({ body: submitVotesSchema, params: sessionAndRoundIdParams }),
    handleController(async (req, res, next) => {
      const finalizedRound = await votingService.submitVotes(
        req.validatedParams.sessionId,
        req.validatedParams.roundId,
        req.userId,
        req.validatedBody.votes,
      );
      res.json(finalizedRound);
    })
  );

  router.post(
    "/:sessionId/finalize",
    zodMiddleware({ params: sessionIdParam }),
    handleController(async (req, res, next) => {
      const session = await votingService.finalizeSession(
        req.validatedParams.sessionId,
        req.userId,
      );
      res.json(session);
    })
  );

  return router;
};
