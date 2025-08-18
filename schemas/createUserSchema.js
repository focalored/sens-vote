const { z } = require('zod');

const createUserSchema = z.object({
  username: z.string(),
  name: z.string(),
  password: z.string(),
});

module.exports = createUserSchema;
