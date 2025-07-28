const { Schema, model, Document, Types } = require('mongoose');

const metadataSchema = new Schema({
  candidateType: {
    type: String,
    enum: ['names', 'options'],
  },
}, { _id: false });

const roundResultSchema = new Schema({
  type: { type: String, enum: ['solo', 'exec', 'callback', 'pandahood'], required: true },
  winners: {
    soloist: { type: String, default: null },
    understudy: { type: String, default: null },
    role: { type: String, default: null },
    bucket: { type: String, default: null },
  },
  isComplete: { type: Boolean, required: true },
});

const roundSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  roundNumber: { type: Number, required: true },
  candidates: { type: [String] },
  metadata: { type: metadataSchema, default: null },
  evalMode: { type: String, enum: ['full', 'understudy_only'], required: true },
  votes: [
    {
      candidateId: String,
      count: Number,
      _id: false,
    },
  ],
  result: { type: roundResultSchema, required: false, _id: false },
}, { timestamps: true });

roundSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.sessionId = ret.sessionId.toString();
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

const Round = model("Round", roundSchema);

module.exports = Round;
