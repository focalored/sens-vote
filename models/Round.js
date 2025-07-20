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
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model("Round", roundSchema);
