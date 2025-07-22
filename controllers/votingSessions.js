module.exports = (votingService) => {
  const router = require('express').Router();
  const zodMiddleware = require('../utils/zodMiddleware');
  const startSessionSchema = require('../schemas/startSessionSchema');
  const advanceRoundSchema = require('../schemas/advanceRoundSchema');
  const submitVotesSchema = require('../schemas/submitVotesSchema');

  router.get(
    "/",
    async (req, res, next) => {
      const sessions = await votingService.getSessions();
      res.json(sessions);
    });

  router.get(
    "/:sessionId",
    async (req, res, next) => {
      const session = await votingService.getSession(req.params.sessionId);
      res.json(session);
    });
  
  router.get(
    "/:sessionId/rounds/:roundId",
    async (req, res, next) => {
      const round = await votingService.getRound(req.params.sessionId, req.params.roundId);
      res.send(round);
    });

  router.post(
    "/",
    async (req, res, next) => {
      const session = await votingService.createSession();
      res.status(201).json(session);
    });

  router.post(
    "/:sessionId/start",
    zodMiddleware(startSessionSchema),
    async (req, res, next) => {
      const session = await votingService.startSession(
        req.params.sessionId,
        req.validatedBody,
      );
      res.json(session);
    });

  router.post(
    "/:sessionId/next",
    zodMiddleware(advanceRoundSchema),
    async (req, res, next) => {
      const createdRound = await votingService.advanceToNextRound(
        req.params.sessionId,
        req.validatedBody.providedCandidates,
      );
      res.json(createdRound);
    });

  router.post(
    "/:sessionId/rounds/:roundId/vote",
    zodMiddleware(submitVotesSchema),
    async (req, res, next) => {
      const finalizedRound = await votingService.submitVotes(
        req.params.sessionId,
        req.params.roundId,
        req.validatedBody.votes,
      );
      res.json(finalizedRound);
    });

  router.post(
    "/:sessionId/finalize",
    async (req, res, next) => {
      const session = await votingService.finalizeRound(req.params.sessionId);
      res.json(session);
    });

  return router;
};
