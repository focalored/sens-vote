const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

const sessionIdParam = z.object({
  sessionId: objectIdSchema,
})

const sessionAndRoundIdParams = z.object({
  sessionId: objectIdSchema,
  roundId: objectIdSchema,
})

module.exports = {
  sessionIdParam,
  sessionAndRoundIdParams,
  objectIdSchema,
};
