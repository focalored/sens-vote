const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const votingSessionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["solo", "exec", "membership"],
    required: true
  },
  status: {
    type: String,
    enum: ["draft", "active", "complete"],
    required: true
  },
  configuration: {
    voterCount: {
      type: Number,
      required: true
    },
    song: String,
    role: String
  },
  initialCandidates: {
    type: [String],
    required: true
  },
  rounds: {
    type: [{
      roundNumber: {
        type: Number,
        required: true
      },
      evalMode: {
        type: String,
        required: true
      },
      candidates: {
        type: [String],
        required: true
      },
      votes: {
        type: [Number],
        required: true
      },
      result: {
        winners: {
          type: {
            soloist: String,
            understudy: String,
            execRole: String,
            babyPanda: String
          },
          required: true
        },
        isComplete: {
          type: Boolean,
          required: true
        }
      }
    }],
    required: true
  },
  createdAt: Date,
  decidedAt: Date,
});

module.exports = mongoose.model("VotingSession", votingSessionSchema);
