const Session = require("../../../models/Session");
const Round = require("../../../models/Round");

const initialSessions = [
  {
    status: "awaiting_moderator",
    type: "solo",
    configuration: {
      voterCount: 17,
      song: "Mirrors",
    },
    initialCandidates: ["Bob", "Annie", "Calvin"],
    roundIds: [],
  },
  {
    status: "draft",
    type: null,
    configuration: null,
    initialCandidates: null,
    roundIds: []
  },
];

const nonExistingSessionId = async () => {
  const session = await Session.create({ status: "draft" });
  await session.deleteOne();

  return session.id;
};

const nonExistingRoundId = async () => {
  const round = await Round.create({ roundNumber: 20 });
  await round.deleteOne();

  return round.id;
};

const sessionsInDb = async () => {
  const sessions = await Session.find({});
  return sessions.map((session, i) => {
    if (!session) {
      throw new Error(`Session at index ${i} is undefined`);
    }
    try {
      return JSON.parse(JSON.stringify(session));
    } catch (err) {
      console.error("Failed to serialize session:", session);
      throw err;
    }
  });
};

const roundsInDb = async () => {
  const rounds = await Round.find({});
  return rounds.map((round) => JSON.parse(JSON.stringify(round)));
};

const normalizeSession = (session) => {
  const json = typeof session.toJSON === 'function' ? session.toJSON() : session;

  const clean = JSON.parse(JSON.stringify(json));

  delete clean.id;
  delete clean.roundIds;
  delete clean.createdAt;
  delete clean.updatedAt;

  return clean;
}

const normalizeRound = (round) => {
  const json = typeof round.toJSON === 'function' ? round.toJSON() : round;

  const clean = JSON.parse(JSON.stringify(json));

  delete clean.id;
  delete clean.createdAt;
  delete clean.updatedAt;

  return clean;
};

module.exports = {
  initialSessions,
  nonExistingSessionId,
  nonExistingRoundId,
  sessionsInDb,
  roundsInDb,
  normalizeSession,
  normalizeRound,
};
