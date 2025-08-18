const { Schema, model, Document, Types } = require('mongoose');

const userSchema = new Schema({
  username: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  sessions: { type: [Schema.Types.ObjectId], ref: 'Session', default: [] },
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
  },
});

const user = model('User', userSchema);

module.exports = user;
