const { z } = require('zod');

const advanceRoundSchema = z.object({
  providedCandidates: z.array(z.string()).nonempty(),
});

module.exports = advanceRoundSchema;
