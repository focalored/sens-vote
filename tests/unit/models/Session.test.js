const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Session = require('../../../models/Session');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Session.deleteMany({});
});

describe('Session Model', () => {
  it('should create a session with valid data', async () => {
    const sessionData = {
      status: 'awaiting_moderator',
      type: 'pandahood',
      configuration: {
        voterCount: 20,
        proposal: 'Alice - Unconditional accept',
        song: 'Mirrors',
        role: null,
      },
      initialCandidates: ['Alice'],
    };

    const session = await Session.create(sessionData);
    const json = session.toJSON();

    expect(json.status).toBe('awaiting_moderator');
    expect(json.type).toBe('pandahood');
    expect(json.configuration).toStrictEqual({
        voterCount: 20,
        proposal: 'Alice - Unconditional accept',
        song: 'Mirrors',
        role: null,
      });
    expect(json.initialCandidates).toStrictEqual(['Alice']);
    expect(json.createdAt).toBeDefined();
  });

  it('should allow absence for optional fields', async () => {
    const sessionData = { status: 'draft' };

    const session = await Session.create(sessionData);

    expect(session.status).toBe('draft');
    expect(session.type).toBe(null);
    expect(session.configuration).toBe(null);
    expect(session.initialCandidates).toStrictEqual([]);
    expect(session.roundIds).toStrictEqual([]);
    expect(session.createdAt).toBeDefined();
  });

  it('should allow null values for optional fields', async () => {
    const sessionData = { status: 'draft', roundIds: null };

    const session = await Session.create(sessionData);
    const json = session.toJSON();

    expect(session.status).toBe('draft');
    expect(session.type).toBe(null);
    expect(session.configuration).toBe(null);
    expect(json.roundIds).toStrictEqual(null);
    expect(session.initialCandidates).toStrictEqual([]);
    expect(session.createdAt).toBeDefined();
  });

  it('should throw validation error if required fields are missing', async () => {
    const sessionData = { initialCandidates: ['Alice'] };
    await expect(Session.create(sessionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should convert ObjectIds to strings in toJSON', async () => {
    const sessionData = {
      status: 'awaiting_moderator',
      type: 'pandahood',
      configuration: {
        voterCount: 20,
        proposal: 'Alice - Unconditional accept',
        song: 'Mirrors',
      },
      initialCandidates: ['Alice'],
      roundIds: [new mongoose.Types.ObjectId()],
    };

    const session = await Session.create(sessionData);
    const json = session.toJSON();

    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.roundIds[0]).toStrictEqual(expect.any(String));
  });
});
