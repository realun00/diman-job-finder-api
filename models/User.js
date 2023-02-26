import { Schema, model } from "mongoose";

import validator from "validator";

const User = new Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true, validate: [validator.isEmail, "Email is invalid"] },
  password: { type: String, required: true },
  roles: [{ type: String, ref: "Role", required: true }],
});

export default model("User", User);
