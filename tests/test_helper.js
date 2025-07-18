const Session = require("../models/Session");
const Round = require("../models/Round");

const initialSessions = [
  {
    status: "awaiting_moderator",
    type: "solo",
    configuration: {
      voterCount: 17,
      song: "Mirrors"
    },
    initialCandidates: ["Bob", "Annie", "Calvin"],
    roundIds: []
  },
  {
    status: "draft",
    type: null,
    configuration: null,
    initialCandidates: null
  }
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
}

const usersInDb = async () => {
  
};

module.exports = {
  initialSessions,
  nonExistingSessionId,
  nonExistingRoundId,
  sessionsInDb,
  roundsInDb,
  usersInDb
}