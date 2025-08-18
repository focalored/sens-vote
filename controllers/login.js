const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const loginRouter = require('express').Router();
const User = require('../models/User');
const zodMiddleware = require('../utils/zodMiddleware');
const handleController = require('../utils/handleController');

loginRouter.post(
  '/',
  handleController(async (req, res, next) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash);
    
    if (!(user && passwordCorrect)) {
      return res.status(401).json({ error: 'invalid username or password' });
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: '1h' });

    res.status(200).send({ token, username: user.username, name: user.name });
  }),
);

module.exports = loginRouter;
