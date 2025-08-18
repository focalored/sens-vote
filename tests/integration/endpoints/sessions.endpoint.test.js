const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../app");
const { MONGODB_URI } = require('../../../utils/config');
const VotingService = require('../../../services/VotingService');
const Round = require("../../../models/Round");
const Session = require("../../../models/Session");
const User = require('../../../models/User');
const bcrypt = require('bcrypt');

const helper = require("../utils/testHelpers");

const api = request(app);

let token;
let testUser;

const authReq = (req) => req.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);

  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('secret', 10);
  testUser = new User({ username: 'test_user', name: 'Test User', passwordHash });
  await testUser.save();

  const res = await api
    .post('/api/login')
    .send({ username: testUser.username, password: 'secret' })
    .expect(200);

  token = res.body.token;
  if (!token) throw new Error('Login did not return token in test setup');
});

beforeEach(async () => {
  await Session.deleteMany({});
  await Round.deleteMany({});
  
  const createdSession = await Session.create({ user: testUser._id, ...helper.initialSessions[0] });
  const createdRound = await Round.create({
    sessionId: createdSession._id,
    ...helper.initialRounds[0],
  });

  await Session.findByIdAndUpdate(createdSession._id, {
    $set: { roundIds: [createdRound._id] }
  }, { new: true });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('GET /', () => {
  it('returns 200 and all sessions', async () => {
    const session = await Session.findOne({});

    const res = await authReq(api.get(`/api/sessions/`))
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    expect(Array.isArray(res.body));
    expect(res.body[0]).toStrictEqual(JSON.parse(JSON.stringify(session.toJSON())));
  });
});

describe('GET /:sessionId', () => {
  it('returns 200 and the session object when params are valid and service resolves', async () => {
    const session = await Session.findOne({});

    const res = await authReq(api.get(`/api/sessions/${session._id.toString()}`))
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    expect(res.body).toStrictEqual(JSON.parse(JSON.stringify(session.toJSON())));
  });

  it('returns 400 with invalid id', async () => {
    const res = await authReq(api.get(`/api/sessions/invalidSessionId34242/`))
      .expect(400);
  });

  it('returns 404 when session not found', async () => {
    const sessionId = await helper.nonExistingSessionId(testUser._id);

    const res = await authReq(api.get(`/api/sessions/${sessionId}`))
      .expect(404);
  });
});

describe('POST /', () => {
  it('returns 201 and created session', async () => {
    const res = await authReq(api.post(`/api/sessions/`))
      .expect(201)
      .expect('Content-Type', /application\/json/);

    expect(res.body.status).toStrictEqual('draft');
  });
});

describe('POST /:sessionId/start', () => {
  it('returns 200 and the started round', async () => {
    const session = await Session.create({ user: testUser._id, status: 'draft' });

    let startedSession = {
      user: testUser._id.toString(),
      id: session._id.toString(),
      status: 'awaiting_moderator',
      type: 'exec',
      initialCandidates: ['Alice', 'Bob'],
      configuration: {
        voterCount: 20,
        role: 'Recording Chair',
        proposal: null,
        song: null,
      },
      roundIds: [],
    };

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/start`))
      .send({
        type: 'exec',
        candidates: ['Alice', 'Bob'],
        voterCount: 20,
        role: 'Recording Chair',
      })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(helper.normalizeSession(res.body)).toStrictEqual(startedSession);
  });

  it('returns 400 with invalid request parameters', async () => {
    const session = await Session.create({ user: testUser._id, status: 'draft' });

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/start`))
      .send({
        type: 'd',
        candidates: [1, 'Bob'],
        voterCount: null,
        role: 'Recording Chair',
      })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    helper.expectZodError(res.body, [
      { path: 'type', code: 'invalid_value' },
      { path: 'candidates.0', code: 'invalid_type' },
      { path: 'voterCount', code: 'invalid_type' },
    ]);
  });

  it('returns 400 with duplicate candidates', async () => {
    const session = await Session.create({ user: testUser._id, status: 'draft' });

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/start`))
      .send({
        type: 'exec',
        candidates: ['Alice', 'Alice'],
        voterCount: 20,
        role: 'Recording Chair',
      })
      .expect(400);
  });

  it('returns 404 when session is not found', async () => {
    const sessionId = await helper.nonExistingSessionId(testUser._id);

    const res = await authReq(api.post(`/api/sessions/${sessionId}/start`))
      .send({
        type: 'exec',
        candidates: ['Alice', 'Bob'],
        voterCount: 20,
        role: 'Recording Chair',
      })
      .expect(404);
  });

  it('returns 409 with invalid session state', async () => {
    const session = await Session.create({ user: testUser._id, status: 'draft' });

    session.status = 'awaiting_moderator';
    await session.save();

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/start`))
      .send({
        type: 'exec',
        candidates: ['Alice', 'Bob'],
        voterCount: 20,
        role: 'Recording Chair',
      })
      .expect(409)
  });

  it('does not mutate session on failure', async () => {
    const session = await Session.create({ user: testUser._id, status: 'draft' });

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/start`))
      .send({
        type: 'exec',
        candidates: ['Alice', 'Alice'],
        voterCount: 20,
        role: 'Recording Chair',
      })
      .expect(400);
    
    const unchangedSession = await Session.findById(session._id);
    expect(helper.normalizeSession(unchangedSession)).toStrictEqual(helper.normalizeSession(session));
  });
});

describe('POST /:sessionId/next', () => {
  describe('when advancing to 1st round', () => {
    it('returns 200 and the created round with provided candidates', async () => {
      const session = await Session.findOne({});

      session.roundIds = [];
      await session.save();

      let createdRound = {
        sessionId: session._id.toString(),
        roundNumber: 1,
        candidates: ['Alice', 'Bob'],
        metadata: { candidateType: 'names' },
        evalMode: 'full',
        votes: [],
      };

      const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
        .send({
          providedCandidates: ['Alice', 'Bob'],
        })
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const updatedSession = await Session.findOne({});

      expect(helper.normalizeRound(res.body)).toStrictEqual(createdRound);
      
      expect(helper.normalizeSession(updatedSession).roundIds).toStrictEqual([res.body.id]);
      expect(updatedSession.status).toBe('awaiting_votes');
    });

    it('returns 400 without provided candidates', async () => {
      const session = await Session.findOne({});

      session.roundIds = [];
      await session.save();

      const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
        .expect(400)
    });
  });

  describe('when advancing to subsequent rounds', () => {
    it('returns 200 and the created round with provided candidates', async () => {
      const session = await Session.findOne({});
      const prevRound = await Round.create({
        ...helper.initialRounds[1],
        sessionId: session._id,
        roundNumber: 1,
      });

      session.roundIds = [prevRound._id];
      await session.save();

      let createdRound = {
        sessionId: session._id.toString(),
        roundNumber: 2,
        candidates: ['Alice', 'Bob', 'Connor'],
        metadata: { candidateType: 'names' },
        evalMode: 'full',
        votes: [],
      };

      const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
        .send({
          providedCandidates: ['Alice', 'Bob', 'Connor'],
        })
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const updatedSession = await Session.findOne({});

      expect(helper.normalizeRound(res.body)).toStrictEqual(createdRound);
      
      expect(helper.normalizeSession(updatedSession).roundIds).toStrictEqual([prevRound._id.toString(), res.body.id]);
      expect(updatedSession.status).toBe('awaiting_votes');
    });

    it('returns 200 and the created round with no provided candidates', async () => {
      const session = await Session.findOne({});
      const prevRound = await Round.create({
        ...helper.initialRounds[1],
        sessionId: session._id,
        roundNumber: 1,
      });

      session.roundIds = [prevRound._id];
      await session.save();

      let createdRound = {
        sessionId: session._id.toString(),
        roundNumber: 2,
        candidates: ['Alice', 'Bob'],
        metadata: { candidateType: 'names' },
        evalMode: 'full',
        votes: [],
      };

      const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
        .send({})
        .expect(200)
        .expect('Content-Type', /application\/json/);

      const updatedSession = await Session.findOne({});

      expect(helper.normalizeRound(res.body)).toStrictEqual(createdRound);
      
      expect(helper.normalizeSession(updatedSession).roundIds).toStrictEqual([prevRound._id.toString(), res.body.id]);
      expect(updatedSession.status).toBe('awaiting_votes');
    });
  });

  it('returns 400 with invalid request parameters', async () => {
    const session = await Session.findOne({});

    const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
      .send({
        providedCandidates: [],
      })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    helper.expectZodError(res.body, [
      { path: 'providedCandidates', code: 'too_small' },
    ]);
  });

  it('returns 400 with empty/duplicate candidates', async () => {
    const session = await Session.findOne({});

    const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
      .send({
        providedCandidates: ['', ''],
      })
      .expect(400)
  });

  it('returns 404 when session is not found', async () => {
    const sessionId = await helper.nonExistingSessionId(testUser._id);

    const res = await authReq(api.post(`/api/sessions/${sessionId}/next`))
      .send({})
      .expect(404);
  });

  it('returns 409 with invalid session state', async () => {
    const session = await Session.findOne({});
    
    session.status = 'awaiting_votes';
    await session.save();

    const res = await authReq(api.post(`/api/sessions/${session._id}/next`))
      .send({})
      .expect(409)
  });
});

describe('POST /:sessionId/finalize', () => {
  it('returns 200 with finalized session', async () => {
    const session = await Session.findOne({});

    const res = await authReq(api.post(`/api/sessions/${session._id}/finalize`))
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const updatedSession = await Session.findById(session._id);

    expect(updatedSession.status).toBe('complete');
  });

  it('returns 404 when session is not found', async () => {
    const sessionId = await helper.nonExistingSessionId(testUser._id);

    const res = await authReq(api.post(`/api/sessions/${sessionId}/finalize`))
      .expect(404);
  });

  it('returns 409 with invalid session status', async () => {
    const session = await Session.findOne({});

    session.status = 'awaiting_votes';
    await session.save();

    const res = await authReq(api.post(`/api/sessions/${session._id}/finalize`))
      .expect(409);
  });
});