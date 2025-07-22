const { z } = require('zod');

const submitVotesSchema = z.object({
  votes: z.array(z.object({
    candidateId: z.string(),
    count: z.number().min(0),
  })).nonempty(),
});

module.exports = submitVotesSchema;
