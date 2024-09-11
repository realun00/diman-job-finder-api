import { Router } from "express";
import { check } from "express-validator";
import controller from "../controllers/authController.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

//import authMiddleware from "./middleware/authMiddleware.js";

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
router.get("/user", roleMiddleware(["ADMIN"]), controller.getUsers);
router.get("/userDetails", roleMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.getUserDetails);
router.get("/user/:id", roleMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.getUser);
router.delete("/user/:id", roleMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.deleteUser);
router.put("/user/:id", roleMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.updateUser);
router.put("/updateUserDetails", roleMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.updateUserDetails);
router.patch("/changePassword", roleMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.changePassword);


export default router;
