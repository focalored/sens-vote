const assert = require("node:assert");
const { test, after, beforeEach, describe } = require("node:test");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const helper = require("./test_helper");
const Session = require("../models/Session");
const Round = require("../models/Round");
const api = supertest(app);

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
        { candidateId: "Calvin", count: 3 }
      ],
      result: {
        winners: {
          soloist: "Annie",
          understudy: "Bob"
        },
        isComplete: true
      }
    });

    session1.roundIds = [round1._id];
    session1.status = "complete";
    await session1.save();

    await Session.create(helper.initialSessions[1]);
  });

  test("sessions are returned as json", async () => {
    await api
    .get("/api/sessions")
    .expect(200)
    .expect("Content-Type", /application\/json/);
  });

  test("all sessions are returned", async () => {
    const response = await api.get("/api/sessions");

    assert.strictEqual(response.body.length, helper.initialSessions.length);
  });

  test("a specific session is within the returned sessions", async () => {
    const response = await api.get("/api/sessions");

    const sessionIds = response.body.map(e => e.id);
    assert(sessionIds.includes(session1.id));
  });

  describe("viewing a specific session", () => {
    test("succeeds with a valid id", async () => {
      const sessionsAtStart = await helper.sessionsInDb();
      const sessionToView = sessionsAtStart[0];

      const resultSession = await api
        .get(`/api/sessions/${sessionToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      assert.deepStrictEqual(resultSession.body, sessionToView);
    });

    test('fails with status code 404 if session does not exist', async () => {
      const validNonexistingSessionId = await helper.nonExistingSessionId()

      await api.get(`/api/sessions/${validNonexistingSessionId}`).expect(404)
    });

    test('fails with status code 400 if sessionId is invalid', async () => {
      const invalidSessionId = "5a3d5da59070081a82a3445";

      await api.get(`/api/sessions/${invalidSessionId}`).expect(400);
    });
  });

  describe("viewing a round", () => {
    test("retrieves a round by session and roundId", async () => {
      const resultRound = await api
        .get(`/api/sessions/${session1.id}/rounds/${round1.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);
      
      assert.deepStrictEqual(resultRound.body, round1);
    });
  });
});

after(async () => {
  await mongoose.connection.close();
});
