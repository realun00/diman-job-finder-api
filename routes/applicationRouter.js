import { Router } from "express";
import applicationController from "../controllers/applicationController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import applicationMiddleware from "../middleware/applicationMiddleware.js";

const router = new Router();

// Apply for a job with a motivational letter (any authenticated user)
router.post("/apply/:jobId", authMiddleware, applicationController.applyForJob);

// Get user's applications (any authenticated user)
router.get("/my-applications", authMiddleware, applicationController.getUserApplications);

// Get applicants for a job (organization only)
router.get("/applicants/:jobId/", authMiddleware, applicationMiddleware(["ORGANIZATION"]), applicationController.getJobApplicants);

// Update application status (organization only)
router.patch("/application/:applicationId/status", authMiddleware, applicationMiddleware(["ORGANIZATION"]), applicationController.updateApplicationStatus);

export default router;