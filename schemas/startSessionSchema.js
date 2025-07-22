const { z } = require('zod');

const startSessionSchema = z.object({
  type: z.enum(['solo', 'exec', 'callback', 'pandahood']),
  candidates: z.array(z.string()).nonempty(),
  voterCount: z.number().min(1),
  proposal: z.string().optional(),
  song: z.string().optional(),
  role: z.string().optional(),
});

module.exports = startSessionSchema;
