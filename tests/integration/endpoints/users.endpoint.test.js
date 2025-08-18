const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../app");
const { MONGODB_URI } = require('../../../utils/config');
const User = require("../../../models/User");
const bcrypt = require('bcrypt');

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

it('returns 201 and creates new user with fresh username', async () => {
  const usersAtStart = await helper.usersInDb();

  const newUser = {
    username: 'vincentli3',
    name: 'Vincent Li',
    password: 'cheropsu666',
  };

  const res = await api
    .post('/api/users')
    .send(newUser)
    .expect(201)
    .expect('Content-Type', /application\/json/);
  
  const usersAtEnd = await helper.usersInDb();
  const usernames = usersAtEnd.map((u) => u.username);

  expect(usersAtEnd.length).toBe(usersAtStart.length + 1);
  expect(usernames).toContain(newUser.username);
});

it('returns 400 with duplicate username', async () => {
  const newUser = {
    username: 'test_user',
    name: 'Vincent Li',
    password: 'cheropsu666',
  };

  const res = await api
    .post('/api/users')
    .send(newUser)
    .expect(400);
});
