import { Schema, model } from "mongoose";

const Category = new Schema({
  value: { type: String, unique: true, default: "Web developer" },
});

export default model('Category', Category);
