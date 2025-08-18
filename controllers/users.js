const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/User');
const zodMiddleware = require('../utils/zodMiddleware');
const createUserSchema = require('../schemas/createUserSchema');
const handleController = require('../utils/handleController');

usersRouter.post(
  '/',
  zodMiddleware({ body: createUserSchema }),
  handleController(async (req, res, next) => {
    const { username, name, password } = req.validatedBody;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      name,
      passwordHash,
    });

    const savedUser = await user.save()

    res.status(201).json(savedUser);
  }),
);

usersRouter.get(
  '/',
  handleController(async (req, res, next) => {
    const users = await User.find({}).populate('sessions', {
      status: 1,
      type: 1,
      configuration: 1,
      initialCandidates: 1,
      roundIds: 1,
    })
  }),
);

module.exports = usersRouter;
