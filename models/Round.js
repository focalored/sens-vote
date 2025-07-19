const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "VotingSession" },
    roundNumber: Number,
    evalMode: String,
    candidates: [String],
    votes: [
      {
        candidateId: String,
        count: Number,
      },
    ],
    result: Object,
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
