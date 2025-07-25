const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "VotingSession" },
    roundNumber: Number,
    evalMode: String,
    candidates: [String],
    metadata: { candidateType: {
      type: String,
      enum: ['people', 'options'],
    } },
    votes: [
      {
        candidateId: String,
        count: Number,
      },
    ],
    result: {
      winners: {
        soloist: String,
        understudy: String,
        role: String,
        bucket: String,
      },
      isComplete: Boolean,
    },
  },
  { timestamps: true },
);

roundSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    if (ret.votes) {
      ret.votes = ret.votes.map(({_id, ...vote}) => vote);
    }

    if (ret.sessionId && typeof ret.sessionId === 'object') {
      ret.sessionId = ret.sessionId.toString();
    }
  },
});

module.exports = mongoose.model("Round", roundSchema);
