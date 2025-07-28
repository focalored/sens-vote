const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../app");
const helper = require("../utils/testHelpers");
const votingService = require('../../../services/VotingService');
const Session = require("../../../models/Session");
const Round = require("../../../models/Round");
const api = request(app);

describe("when there are initially some sessions saved", () => {
  let session1, round1;

  beforeEach(async () => {
    await Session.deleteMany({});
    await Round.deleteMany({});

    session1 = await Session.create(helper.initialSessions[0]);

    round1 = await Round.create({
      sessionId: session1._id,
      roundNumber: 1,
      candidates: ["Bob", "Annie", "Calvin"],
      votes: [
        { candidateId: "Bob", count: 4 },
        { candidateId: "Annie", count: 10 },
        { candidateId: "Calvin", count: 3 },
      ],
      result: {
        winners: {
          soloist: "Annie",
          understudy: "Bob",
        },
        isComplete: true,
      },
    });

    session1.roundIds = [round1._id];
    session1.status = "complete";
    await session1.save();

    await Session.create(helper.initialSessions[1]);
  });

  it("should return data as json", async () => {
    const res = await api
      .get("/api/sessions")
      .expect(200)
      .expect("Content-Type", /application\/json/);
    
    expect(typeof res.body).toBe('object');
  });

  it("should return all saved sessions", async () => {
    const res = await api.get("/api/sessions");
    expect(res.body.length).toBe(helper.initialSessions.length);
  });

  it("should return a specific session within the sessions", async () => {
    const res = await api.get("/api/sessions");

    const sessionIds = res.body.map((s) => s.id);
    expect(sessionIds).toContain(session1.id);
  });

  describe("viewing a session", () => {
    it("should return the desired session with a valid id", async () => {
      const sessionsAtStart = await helper.sessionsInDb();
      const sessionToView = sessionsAtStart[0];

      const res = await api
        .get(`/api/sessions/${sessionToView.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(res.body).toStrictEqual(sessionToView);
    });

    it("should fail with status code 404 if session does not exist", async () => {
      const validNonexistingSessionId = await helper.nonExistingSessionId();

      await api
        .get(`/api/sessions/${validNonexistingSessionId}`)
        .expect(404);
    });

    it("should fail with status code 400 if sessionId is invalid", async () => {
      const invalidSessionId = "5a3d5da59070081a82a3445";

      await api
        .get(`/api/sessions/${invalidSessionId}`)
        .expect(400);
    });
  });

  describe("viewing a round", () => {
    it("should return the round by with valid sessionId and roundId", async () => {
      const res = await api
        .get(`/api/sessions/${session1.id}/rounds/${round1.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      expect(helper.normalizeRound(res.body)).toEqual(helper.normalizeRound(round1));
    });
  });
});

describe('POST /api/sessions', () => {
  it('should return the created session with valid input', async () => {
    const session = helper.initialSessions[1];

    const res = await api
      .post(`/api/sessions/`)
      .expect(201)
      .expect('Content-Type', /application\/json/);
    
    expect(helper.normalizeSession(res.body)).toStrictEqual(helper.normalizeSession(session));
  });
});

describe('POST /api/sessions/:sessionId/start', () => {
  let session1;

  beforeEach(async () => {
    Session.deleteMany({});

    session1 = await Session.create(helper.initialSessions[1]);
  });

  it('should return the started session with valid input', async () => {
    const reqBody = {
      type: 'pandahood',
      candidates: ['Alice'],
      voterCount: 20,
      proposal: 'Alice - Unconditional admit',
      song: 'Mirrors',
    };

    const res = await api
      .post(`/api/sessions/${session1.id}/start`)
      .send(reqBody)
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    expect(res.body.status).toBe('awaiting_moderator');
    expect(res.body.type).toBe('pandahood');
    expect(res.body.initialCandidates).toEqual(['Alice']);
    expect(res.body.configuration).toStrictEqual({
      voterCount: 20,
      proposal: 'Alice - Unconditional admit',
      song: 'Mirrors',
      role: null,
    });
  });

  it('should fail with status 400 with invalid input', async () => {
    const reqBody = {
      type: 'invalid',
      candidates: [1],
      voterCount: 0,
    };

    const res = await api
      .post(`/api/sessions/${session1.id}/start`)
      .send(reqBody)
      .expect(400)
    
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/sessions/:sessionId/next', () => {
  describe('advancing to 1st round', () => {
    let session1, session2;

    beforeEach(async () => {
      Session.deleteMany({});

      session1 = await Session.create({
        status: 'awaiting_moderator',
        type: 'pandahood',
        configuration: {
          voterCount: 20,
          proposal: 'Alice - Unconditional admit',
          song: 'Mirrors',
          role: null,
        },
        initialCandidates: ['Alice'],
      });

      session2 = await Session.create({
        status: 'awaiting_moderator',
        type: 'solo',
        configuration: {
          voterCount: 20,
          proposal: null,
          song: 'Mirrors',
          role: null,
        },
        initialCandidates: ['Alice', 'Bob', 'Connor'],
      });
    });

    it('should return created round with valid input', async () => {
      const reqBody = {
        providedCandidates: ['Alice'],
      };

      const sessionId = session1.toJSON().id;

      const res = await api
        .post(`/api/sessions/${sessionId}/next`)
        .send(reqBody)
        .expect(200)
        .expect('Content-Type', /application\/json/);
      
      const expectedRound = {
        sessionId,
        roundNumber: 1,
        candidates: ['Yes', 'No'],
        metadata: { candidateType: 'options' },
        evalMode: 'full',
        votes: [],
      };
      
      expect(helper.normalizeRound(res.body)).toStrictEqual(helper.normalizeRound(expectedRound));
    });

    it('should fail with status 404 with nonexistent session', async () => {
      const reqBody = {
        providedCandidates: ['Alice'],
      };
      
      const validNonexistingSessionId = await helper.nonExistingSessionId();

      await api
        .post(`/api/sessions/${validNonexistingSessionId}/next`)
        .send(reqBody)
        .expect(404);
    });

    it('should fail with status 409 with invalid session state', async () => {
      session1.status = 'draft';
      await session1.save();
      
      const reqBody = {
        providedCandidates: ['Alice'],
      };

      const sessionId = session1.toJSON().id;

      const res = await api
        .post(`/api/sessions/${sessionId}/next`)
        .send(reqBody)
        .expect(409);
    });

    it('should fail with status 400 with duplicates in providedCandidates', async () => {
      const reqBody = {
        providedCandidates: ['Alice', 'Bob', 'Connor', 'Connor'],  
      };

      const sessionId = session2.toJSON().id;

      const res = await api
        .post(`/api/sessions/${sessionId}/next`)
        .send(reqBody)
        .expect(400);

      expect(res.body).toStrictEqual({
        error: 'Duplicate candidates are not allowed',
      });
    });
  });

  describe('advancing to subsequent rounds', () => {});
});

afterAll(async () => {
  await mongoose.connection.close();
});
