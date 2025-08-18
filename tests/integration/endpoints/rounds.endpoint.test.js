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

let sessionId;

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

  sessionId = createdSession._id;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('GET /:sessionId/rounds/:roundId', () => {
  it('returns 200 and the round object when params are valid and service resolves', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    const res = await authReq(api.get(`/api/sessions/${session._id.toString()}/rounds/${round._id.toString()}`))
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    expect(res.body).toStrictEqual(JSON.parse(JSON.stringify(round.toJSON())));
  });

  it('returns 400 with invalid id', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    const res = await authReq(api.get(`/api/sessions/invalidSessionId/rounds/${round._id.toString()}`))
      .expect(400);
  });

  it('returns 404 when round not found', async () => {
    const roundId = await helper.nonExistingRoundId(sessionId);

    const res = await authReq(api.get(`/api/sessions/${sessionId}/rounds/${roundId}`))
      .expect(404);
  });

  it('returns 409 when round is found but does not belong to session', async () => {
    const session = await Session.create({ user: testUser._id, ...helper.initialSessions[1] });
    const round = await Round.create({
      sessionId: session._id,
      ...helper.initialRounds[1],
    });
    session.roundIds = [round._id];
    await session.save();

    const res = await authReq(api.get(`/api/sessions/${sessionId}/rounds/${round._id}`))
      .expect(409);
  });
});

describe('POST /:sessionId/rounds/:roundId/vote', () => {
  it('returns 200 and the round object with calculated result', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    session.status = 'awaiting_votes';
    await session.save();

    const votes = [
      { candidateId: 'Alice', count: 15 },
      { candidateId: 'Bob', count: 5 },
    ];

    let finalizedRound = {
      sessionId: session._id.toString(),
      roundNumber: 1,
      candidates: ['Alice', 'Bob'],
      metadata: { candidateType: 'names' },
      evalMode: 'full',
      votes,
      result: {
        type: 'solo',
        winners: {
          soloist: 'Alice',
          understudy: 'Bob',
          role: null,
          bucket: null,
        },
        isComplete: true,
      },
    };

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/rounds/${round._id.toString()}/vote`))
      .send({ votes })
      .expect(200)
      .expect('Content-Type', /application\/json/);
    
    const updatedSession = await Session.findById(session._id);

    expect(helper.normalizeRound(res.body)).toStrictEqual(finalizedRound);
    expect(updatedSession.status).toStrictEqual('awaiting_moderator');
  });

  it('returns 400 with invalid votes array', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    session.status = 'awaiting_votes';
    await session.save();

    const votes = [
      { candidateId: 'Alice', bug: 15 },
      { candidateId: 'Bob', count: 5 },
    ];

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/rounds/${round._id.toString()}/vote`))
      .send({ votes })
      .expect(400)
      .expect('Content-Type', /application\/json/);
    
    helper.expectZodError(res.body, [
      { path: 'votes.0.count', code: 'invalid_type' },
    ]);
  });

  it('returns 404 when round is not found', async () => {
    const roundId = await helper.nonExistingRoundId(sessionId);

    const votes = [
      { candidateId: 'Alice', count: 15 },
      { candidateId: 'Bob', count: 5 },
    ];

    const res = await authReq(api.post(`/api/sessions/${sessionId}/rounds/${roundId}/vote`))
      .send({ votes })
      .expect(404);
  });

  it('returns 409 when round exists but is not the latest active round', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    const createdRound = await Round.create({
      sessionId: session._id,
      ...helper.initialRounds[1],
    });

    session.roundIds.push(createdRound._id);
    await session.save();

    const votes = [
      { candidateId: 'Alice', count: 15 },
      { candidateId: 'Bob', count: 5 },
    ];

    const res = await authReq(api.post(`/api/sessions/${sessionId}/rounds/${round._id}/vote`))
      .send({ votes })
      .expect(409);
  });

  it('returns 409 with invalid session state', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    session.status = 'complete';
    await session.save();

    const votes = [
      { candidateId: 'Alice', count: 15 },
      { candidateId: 'Bob', count: 5 },
    ];

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/rounds/${round._id.toString()}/vote`))
      .send({ votes })
      .expect(409)
  });

  it('returns 400 with vote/candidate mismatch', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    session.status = 'awaiting_votes';
    await session.save();

    const votes = [
      { candidateId: 'Alice', count: 15 },
      { candidateId: 'Connor', count: 5 },
    ];

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/rounds/${round._id.toString()}/vote`))
      .send({ votes })
      .expect(400);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Vote option "Connor" not in declared candidates/)
  });

  it('does not mutate round on failure', async () => {
    const session = await Session.findOne({});
    const round = await Round.findOne({});

    session.status = 'awaiting_votes';
    await session.save();

    const votes = [
      { candidateId: 'Alice', bug: 15 },
      { candidateId: 'Bob', count: 5 },
    ];

    const res = await authReq(api.post(`/api/sessions/${session._id.toString()}/rounds/${round._id.toString()}/vote`))
      .send({ votes })
      .expect(400)
    
    const unchangedRound = await Round.findOne({});
    expect(unchangedRound).toStrictEqual(round);
  });
});
