const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../app");
const { MONGODB_URI } = require('../../../utils/config');
const User = require("../../../models/User");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const helper = require("../utils/testHelpers");

const api = request(app);

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('secret', 10);
  const user = new User({ username: 'test_user', name: 'Test User', passwordHash });
  
  await user.save();
});

it('returns 200 and creates new user with fresh username', async () => {
  const loginInfo = {
    username: 'test_user',
    password: 'secret',
  };

  const res = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(200)
    .expect('Content-Type', /application\/json/);

  expect(res.body.token).toBeDefined();
  expect(res.body.username).toBe('test_user');
  expect(res.body.name).toBe('Test User');
});

it('returns 401 with wrong password', async () => {
  const loginInfo = {
    username: 'test_user',
    password: 'wrong',
  };

  const res = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(401);
});

it('returns 401 with nonexistent username', async () => {
  const loginInfo = {
    username: 'nonexistent_user',
    password: 'secret',
  };

  const res = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(401);
});
