import { Schema, model } from "mongoose";

const Job = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  type: { type: String, required: true },
  likes: { type: Number, default: 0 },
  category: { type: Schema.Types.String, ref: "Category", required: true }, // Reference to Category
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User (Organization)
  authorName: { type: Schema.Types.String, ref: 'User', required: true }, // Reference to User
  isActive: { type: Boolean, default: true }, // Active status
  applicants: [{ type: Schema.Types.ObjectId, ref: 'Application' }], // Reference to Applications
  likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // Array of user IDs who liked the job
});

// Compound index to ensure that the combination of title and author is unique
Job.index({ title: 1, author: 1 }, { unique: true });

export default model("Job", Job);
