const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Round = require('../../../models/Round');

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
  await Round.deleteMany({});
});

describe('Round Model', () => {
  it('should create an initial Round with valid data', async () => {
    const roundData = {
      sessionId: new mongoose.Types.ObjectId(),
      roundNumber: 1,
      candidates: ['Yes', 'No'],
      metadata: { candidateType: 'options' },
      evalMode: 'full',
    };

    const round = await Round.create(roundData);
    const json = round.toJSON();

    expect(round.sessionId).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(round.roundNumber).toBe(1);
    expect(round.candidates).toStrictEqual(['Yes', 'No']);
    expect(json.metadata).toStrictEqual({ candidateType: 'options' });
    expect(round.createdAt).toBeDefined();
  });

  it('should update a round with results', async () => {
    const roundData = {
      sessionId: new mongoose.Types.ObjectId(),
      roundNumber: 1,
      candidates: ['Yes', 'No'],
      metadata: { candidateType: 'options' },
      evalMode: 'full',
    };

    const round = await Round.create(roundData);
    round.result = { type: 'pandahood', winners: { bucket: 'Yes' }, isComplete: true };
    round.votes = [{ candidateId: 'Yes', count: 16 }, { candidateId: 'No', count: 4 }];
    
    await round.save();
    const json = round.toJSON();

    expect(json.votes).toStrictEqual([{ candidateId: 'Yes', count: 16 }, { candidateId: 'No', count: 4 }]);
    expect(json.result).toStrictEqual({
      type: 'pandahood',
      winners: { bucket: 'Yes', role: null, soloist: null, understudy: null },
      isComplete: true }
    );
    expect(json.updatedAt).toBeDefined();
  });

  it('should allow absence of optional fields', async () => {
    const roundData = {
      sessionId: new mongoose.Types.ObjectId(),
      roundNumber: 1,
      evalMode: 'full',
    };

    const round = await Round.create(roundData);
    const json = round.toJSON();

    expect(round.sessionId).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(round.roundNumber).toBe(1);
    expect(json.candidates).toStrictEqual([]);
    expect(json.metadata).toBe(null);
    expect(round.createdAt).toBeDefined();
  });

  it('should throw validation error if required fields are missing', async () => {
    const roundData = { roundNumber: 1, evalMode: 'full' };
    await expect(Round.create(roundData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should convert ObjectIds to strings in toJSON', async () => {
    const roundData = {
      sessionId: new mongoose.Types.ObjectId(),
      roundNumber: 1,
      candidates: ['Yes', 'No'],
      metadata: { candidateType: 'options' },
      evalMode: 'full',
    };

    const round = await Round.create(roundData);
    const json = round.toJSON();

    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(typeof json.sessionId).toBe('string');
  });
});
