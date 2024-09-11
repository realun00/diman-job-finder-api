import User from "../models/User.js";
import Role from "../models/Role.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { validationResult } from "express-validator";

import config from "../config.js";

const generateAccessToken = (id, roles, userName) => {
  const payload = {
    id,
    roles,
    userName
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

      const { username, password, email, role, firstName, lastName } = req.body;

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
      const user = new User({
        username: username,
        password: hashPassword,
        email: email,
        roles: [userRole ?? "USER"],
        firstName: firstName,
        lastName: lastName,
      });

      if (userRole !== "USER") {
        delete user.applications;
      }

      await user.save();

      return res.json({ message: `${userRole === "USER" ? "User" : "Organization"} has been created successfully` });

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

      const token = generateAccessToken(user._id, user.roles, user.username);
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
      console.log(error);
    }
  }

  async getUser(req, res) {
    try {
      const userId = req.params?.id;

      if (!userId) {
        return res.status(404).json({ message: "User ID must be defined" });
      }

      await User.findById(userId).exec((error, user) => {
        if (error) {
          return res.status(404).json({ message: `Invalid ID: ${userId}` });
        }
        if (user) {
          return res.json(user);
        } else {
          return res.send(`User with id ${userId} could not be found`);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getUserDetails(req, res) {
    try {
      await User.findById(req?.userId).exec((error, user) => {
        if (error) {
          return res.status(404).json({ message: `Unable to retrieve user info` });
        }
        if (user) {
          const formattedUser = JSON.parse(JSON.stringify(user));
          delete formattedUser.password;
          // delete formattedUser.roles;
          delete formattedUser["__v"];
          delete formattedUser["applications"];
          return res.json(formattedUser);
        } else {
          return res.send(`User with id ${userId} could not be found`);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params?.id;
  
      if (!userId) {
        return res.status(404).json({ message: "User ID must be defined" });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: `User could not be found` });
      }

      // 1. Remove likes by the user from all jobs
      await Job.updateMany(
        { likedBy: userId }, 
        { $pull: { likedBy: userId }, $inc: { likes: -1 } }
      );
  
      // Determine user role
      const userRole = user.roles.includes("ORGANIZATION") ? "ORGANIZATION" : "USER";
  
      if (userRole === "USER") {
        // Remove all applications made by the user
        await Application.deleteMany({ user: userId });
      }
  
      if (userRole === "ORGANIZATION") {
        // Set all jobs created by the organization to inactive (without touching the likes)
        await Job.updateMany(
          { author: userId },
          { $set: { isActive: false } }
        );
      }
  
      // Finally, delete the user
      await user.deleteOne();
  
      return res.json({ message: `User ${user?.username} has been deleted successfully` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error deleting user" });
    }
  }

  
  // async deleteUser(req, res) {
  //   try {
  //     const userId = req.params?.id;

  //     if (!userId) {
  //       return res.status(404).json({ message: "User ID must be defined" });
  //     }

  //     await User.findById(userId).exec((error, user) => {
  //       if (error) {
  //         return res.status(404).json({ message: `Invalid ID: ${userId}` });
  //       }
  //       if (user) {
  //         user.deleteOne();
  //         return res.json({ message: `User ${user?.username} has been deleted successfully` });
  //       } else {
  //         return res.status(404).json({ message: `User could not be found` });
  //       }
  //     });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  async updateUser(req, res) {
    try {
      const userId = req.params?.id;

      if (!userId) {
        return res.status(404).json({ message: "User ID must be defined" });
      }

      await User.findOneAndUpdate({ _id: userId }, req.body, {
        new: true,
        upsert: true, // Make this update into an upsert
      }).exec((error, doc) => {
        if (error) {
          console.log(error);
          return res.status(400).json({ message: `Unable to update` });
        }
        if (doc) {
          const filteredData = Object.fromEntries(
            Object.entries(Object.values(doc)[2]).filter(([key]) => key.includes("email") || key.includes("username"))
          );

          return res
            .status(200)
            .json({ message: `User ${doc?.username} has been updated successfully`, data: filteredData });
        } else {
          return res.status(404).json({ message: `User could not be found` });
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async updateUserDetails(req, res) {
    try {
      const userId = req.userId; // Use the authenticated user ID for updating
      const { email, firstName, lastName, username } = req.body;
  
      if (!userId) {
        return res.status(404).json({ message: "User ID must be defined" });
      }
  
      const updatedUser = await User.findByIdAndUpdate(userId, { email, firstName, lastName, username }, { new: true });
      if (!updatedUser) {
        return res.status(404).json({ message: "User could not be found" });
      }
  
      // Return updated user details excluding the password
      const formattedUser = updatedUser.toObject();
      delete formattedUser.password;
      delete formattedUser["__v"];
      delete formattedUser["applications"];
  
      return res.status(200).json({ message: "User details updated successfully", data: formattedUser });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Unable to update user" });
    }
  }
  
  async changePassword(req, res) {
    try {
      const userId = req.userId; // Use the authenticated user ID for changing the password
      const { oldPassword, newPassword } = req.body;
  
      if (!userId) {
        return res.status(404).json({ message: "User ID must be defined" });
      }
  
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const validPassword = bcrypt.compareSync(oldPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid old password" });
      }
  
      const hashedNewPassword = bcrypt.hashSync(newPassword, 7);
      user.password = hashedNewPassword;
      await user.save();
  
      return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ message: "Unable to change password" });
    }
  }
}

export default new authController();
