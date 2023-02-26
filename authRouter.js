import { Router } from "express";
import { check } from "express-validator";
import controller from "./authController.js";
import authMiddleware from "./middleware/authMiddleware.js";
import roleMiddleware from "./middleware/roleMiddleware.js";

const router = new Router();

router.post(
  "/registration",
  [
    check("username")
      .notEmpty()
      .withMessage("Username cannot be empty")
      .isLength({ min: 4 })
      .withMessage("Username must contain at least 4 symbols"),
    check("password", "Password must be between 4 and 10 symbols").isLength({ min: 4, max: 10 }),
  ],
  controller.registration
);
router.post("/login", controller.login);
router.get("/users", roleMiddleware(["ADMIN"]), controller.getUsers);

export default router;
