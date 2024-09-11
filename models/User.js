import { Schema, model } from "mongoose";
import validator from "validator";

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true, validate: [validator.isEmail, "Email is invalid"] },
  password: { type: String, required: true },
  roles: [{ type: String, ref: "Role", required: true }],
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }], // Reference to Applications
  isActive: { type: Boolean, default: true } // Account status
});

export default model("User", UserSchema);