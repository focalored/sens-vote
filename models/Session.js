const { Schema, model, Document, Types } = require('mongoose');

const sessionConfigurationSchema = new Schema({
  voterCount: { type: Number, required: true },
  proposal: { type: String, default: null },
  song: { type: String, default: null },
  role: { type: String, default: null },
}, { _id: false });

const sessionSchema = new Schema(
  {
    status: { type: String, enum: ['draft', 'awaiting_moderator', 'awaiting_votes', 'complete'], required: true },
    type: { type: String, enum: ['solo', 'exec', 'callback', 'pandahood'], default: null, required: false },
    configuration: { type: sessionConfigurationSchema, default: null, required: false },
    initialCandidates: [{ type: String }],
    roundIds: [{ type: Schema.Types.ObjectId, ref: 'Round' }],
  },
  { timestamps: true },
);

sessionSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;

    if (ret.roundIds) {
      ret.roundIds = ret.roundIds.map((id) => id.toString());
    }
  },
});

const Session = model('Session', sessionSchema);

module.exports = Session;
