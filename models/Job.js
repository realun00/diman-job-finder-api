import { Schema, model } from "mongoose";

const Job = new Schema({
  title: { type: String, unique: true, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  likes: { type: Number, default: 0 },
  category: { type: String, ref: "Category", required: true },
});

export default model("Job", Job);
