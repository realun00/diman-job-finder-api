import { Schema, model } from "mongoose";

const ApplicationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  coverLetter: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now }
});

export default model("Application", ApplicationSchema);