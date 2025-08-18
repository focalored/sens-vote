const Session = require("../../../models/Session");
const Round = require("../../../models/Round");
const User = require('../../../models/User');

const initialSessions = [
  {
    status: "awaiting_moderator",
    type: "solo",
    configuration: {
      voterCount: 20,
      song: "Mirrors",
    },
    initialCandidates: ["Alice", "Bob"],
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

const initialRounds = [
  {
    roundNumber: 1,
    candidates: ['Alice', 'Bob'],
    metadata: { candidateType: 'names' },
    evalMode: 'full',
    votes: [],
    result: {
      type: 'solo',
      winners: {
        soloist: null,
        understudy: null,
        role: null,
        bucket: null,
      },
      isComplete: false,
    },
  },
  {
    roundNumber: 2,
    candidates: ['Alice', 'Bob', 'Connor'],
    metadata: { type: 'names' },
    evalMode: 'full',
    votes: [
      { candidateId: 'Alice', count: 8 },
      { candidateId: 'Bob', count: 7 },
      { candidateId: 'Connor', count: 5 },
    ],
    result: {
      type: 'solo',
      winners: {
        soloist: null,
        understudy: null,
        role: null,
        bucket: null,
      },
      isComplete: false,
    },
  },
];

const nonExistingSessionId = async (user) => {
  const session = await Session.create({
    user,
    status: "draft",
    type: null,
    configuration: null,
    initialCandidates: null,
    roundIds: []
  });

  await session.deleteOne();

  return session._id;
};

const nonExistingRoundId = async (sessionId) => {
  const round = await Round.create({
    sessionId: sessionId,
    ...initialRounds[1],
  });
  await round.deleteOne();

  return round._id;
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

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

const normalizeSession = (session) => {
  const json = typeof session.toJSON === 'function' ? session.toJSON() : session;

  const clean = JSON.parse(JSON.stringify(json));

  // delete clean.id;
  delete clean.createdAt;
  delete clean.updatedAt;

  if (clean.initialCandidates) clean.initialCandidates.sort();

  clean.roundIds = clean.roundIds.map(id => id.toString());

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

const expectZodError = (body, expectedErrors) => {
  expect(body).toHaveProperty('error');
  expect(Array.isArray(body.error)).toBe(true);

  expectedErrors.forEach((expected, i) => {
    const actual = body.error[i];
    expect(actual).toMatchObject({
      path: expected.path,
      code: expected.code ?? expect.any(String),
      message: expected.message ?? expect.any(String),
    });
  });
};

module.exports = {
  initialSessions,
  initialRounds,
  nonExistingSessionId,
  nonExistingRoundId,
  sessionsInDb,
  roundsInDb,
  usersInDb,
  normalizeSession,
  normalizeRound,
  expectZodError,
};
