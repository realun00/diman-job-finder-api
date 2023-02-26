import User from "./models/User.js";
import Role from "./models/Role.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { validationResult } from "express-validator";

import config from "./config.js";

const generateAccessToken = (id, roles) => {
  const payload = {
    id,
    roles,
  };

  return jwt.sign(payload, config.secret, { expiresIn: "24h" });
};

class authController {
  async registration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Registration error", errors });
      }

      const { username, password, email, role } = req.body;

      //Check if username exists
      const candidate = await User.findOne({ username });
      if (candidate) {
        return res.status(400).json({ message: "Username already exists" });
      }

      //Check if email is already in use
      const candidateEmail = await User.findOne({ email: email });
      if (candidateEmail) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      //User role declaration
      let userRole;

      //User role functionality
      if (!role) {
        userRole = (await Role.findOne({ value: "USER" })?.value) ?? "USER";
      } else {
        const checkIfExists = await Role.findOne({ value: role });

        if (checkIfExists) {
          userRole = role;
        } else {
          return res.status(400).json({ message: "Role is invalid" });
        }
      }

      const hashPassword = bcrypt.hashSync(password, 7);
      const user = new User({ username: username, password: hashPassword, email: email, roles: [userRole ?? "USER"] });

      await user.save();

      return res.json({ message: "User has been created successfully" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Registration error" });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ $or: [{ email: username }, { username: username }] });

      if (!user) {
        return res.status(400).json({ message: "Username/email could not be found" });
      }

      const validPassword = bcrypt.compareSync(password, user.password);

      if (!validPassword) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = generateAccessToken(user._id, user.roles);
      return res.json({ token });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Login error" });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      console.log(error)
    }
  }
}

export default new authController();
