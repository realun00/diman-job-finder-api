import { Router } from "express";
import controller from "../controllers/jobsController.js";
import jobMiddleware from "../middleware/jobMiddleware.js";

//import authMiddleware from "./middleware/authMiddleware.js";

const router = new Router();

router.post("/add", jobMiddleware(["ADMIN", "ORGANIZATION"]), controller.createJob);
router.get("/job", jobMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.getAllJobs);
router.get("/job/organization", jobMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.getAllOrganizationJobs);
router.get("/job/:id", jobMiddleware(["ADMIN", "ORGANIZATION", "USER"]), controller.getJob);
router.delete("/job/:id", jobMiddleware(), controller.deleteJob);
router.patch("/job/:id/deactivate", jobMiddleware(), controller.deactivateJob);
router.patch("/job/:id/activate", jobMiddleware(), controller.activateJob);
router.put("/job/:id", jobMiddleware(), controller.updateJob);
router.post("/job/:id/like", jobMiddleware(["USER", "ORGANIZATION", "ADMIN"]), controller.likeJob);
router.delete("/job/:id/like", jobMiddleware(["USER", "ORGANIZATION", "ADMIN"]), controller.unlikeJob);
router.get('/favorites', jobMiddleware(['USER', 'ORGANIZATION']), controller.getLikedJobs);


export default router;
