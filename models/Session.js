const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  status: String,
  type: String,
  configuration: Object,
  initialCandidates: [String],
  roundIds: [mongoose.Schema.Types.ObjectId]
}, { timestamps: true });

sessionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model("Session", sessionSchema);
