import Job from "../models/Job.js";
import { validationResult } from "express-validator";

class JobsController {
  async createJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Add job error", errors });
      }
  
      const { title, description, type, category } = req.body;
  
      const job = new Job({
        title,
        description,
        type,
        category,
        author: req.userId, // Assuming req.userId is set by auth middleware
        authorName: req.userName, // Assuming req.userName is set by auth middleware
      });
  
      await job.save();
  
      return res.json({ message: "Job offer has been created successfully" });
    } catch (error) {
      // Check for duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({ message: "An organization cannot create a job with the same title" });
      }
      console.log(error);
      return res.status(400).json({ message: "Add job error" });
    }
  }
  

  // Like a job
  async likeJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.userId; // Assuming userId is obtained from JWT middleware

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      // Check if the user has already liked the job
      if (job.likedBy.includes(userId)) {
        return res.status(400).json({ message: "You have already liked this job" });
      }

      // Check if the user is owner of the job
      if (job.author.toString() === userId) {
        return res.status(400).json({ message: "You can't like your own jobs" });
      }

      // Check if the job is active
      if (!job.isActive) {
        return res.status(400).json({ message: "You can't like a job that is inactive" });
      }

      // Like the job
      job.likedBy.push(userId);
      job.likes += 1;
      await job.save();

      return res.json({ message: "Job liked", likes: job.likes, isLiked: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error liking job" });
    }
  }

  // Unlike a job (DELETE Request)
  async unlikeJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.userId; // Assuming userId is obtained from JWT middleware

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if the user is owner of the job
      if (job.author.toString() === userId) {
        return res.status(400).json({ message: "You can't like your own jobs" });
      }

      // Check if the job is active
      if (!job.isActive) {
        return res.status(400).json({ message: "You can't unlike a job that is inactive" });
      }

      // Check if the user has liked the job
      if (!job.likedBy.includes(userId)) {
        return res.status(400).json({ message: "You have not liked this job" });
      }

      // Unlike the job
      job.likedBy = job.likedBy.filter((id) => id.toString() !== userId.toString());
      job.likes -= 1;
      await job.save();

      return res.json({ message: "Job unliked", likes: job.likes, isLiked: false });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error unliking job" });
    }
  }

  async getAllJobs(req, res) {
    try {
      const userId = req.userId; // Assuming userId is added by auth middleware

      // Fetch all jobs
      const jobs = await Job.find();

      // Format jobs and add isLiked flag
      const formattedJobs = jobs
        .filter((job) => job.isActive)
        .map((job) => {
          const newJob = job.toObject(); // Convert Mongoose document to plain object

          // Convert likedBy to string array and add isLiked flag
          const likedByIds = newJob.likedBy.map((id) => id.toString());
          newJob.isLiked = likedByIds.includes(userId);

          delete newJob.applicants; // Remove the applicants field
          delete newJob.author; // Remove the author field
          delete newJob.likedBy;

          return newJob;
        });

      res.json(formattedJobs);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching jobs" });
    }
  }

  async getAllOrganizationJobs(req, res) {
    try {
      const userId = req.userId; // Assuming userId is added by auth middleware

      const jobs = await Job.find({ author: userId })
        .populate({
          path: "applicants",
          select: "_id", // Only select the '_id' field for applicants
        })
        .sort({ isActive: -1 });

      res.json(jobs);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching jobs" });
    }
  }

  async getJob(req, res) {
    try {
      const jobId = req.params.id;
      const userId = req.userId; // Assuming userId is added by your auth middleware

      if (!jobId) {
        return res.status(404).json({ message: "Job ID must be defined" });
      }

      const job = await Job.findById(jobId).exec();

      if (!job) {
        return res.status(404).json({ message: `Job with id ${jobId} could not be found` });
      }

      // Convert Mongoose document to plain object
      const newJob = job.toObject();

      // Add isLiked flag
      // Convert likedBy to string array and add isLiked flag
      const likedByIds = newJob.likedBy.map((id) => id.toString());
      newJob.isLiked = likedByIds.includes(userId);

      delete newJob.applicants; // Remove the applicants field
      delete newJob.author; // Remove the author field
      delete newJob.likedBy;

      return res.json(newJob);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error fetching job" });
    }
  }

  // Get all jobs liked by the current user
  async getLikedJobs(req, res) {
    try {
      const userId = req.userId; // The user ID should be available from the middleware

      // Find jobs where likedBy contains the user ID
      const likedJobs = await Job.find({ likedBy: userId });

      // Format jobs and add isLiked flag
      const formattedJobs = likedJobs
        .filter((job) => job.isActive)
        .map((job) => {
          const newJob = job.toObject(); // Convert Mongoose document to plain object

          // Convert likedBy to string array and add isLiked flag
          const likedByIds = newJob.likedBy.map((id) => id.toString());
          newJob.isLiked = likedByIds.includes(userId);

          delete newJob.applicants; // Remove the applicants field
          delete newJob.author; // Remove the author field
          delete newJob.likedBy;

          return newJob;
        });

      return res.json(formattedJobs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching liked jobs" });
    }
  }

  async updateJob(req, res) {
    try {
      const jobId = req.params?.id;
      const userId = req.userId; // The user ID should be available from the middleware

      const { title, description, type, category } = req.body;

      if (!jobId) {
        return res.status(404).json({ message: "Job ID must be defined" });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ message: `Job with id ${jobId} could not be found` });
      }

      if (job.author.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not authorized to update this job" });
      }

      job.title = title || job.title;
      job.description = description || job.description;
      job.type = type || job.type;
      job.category = category || job.category;

      await job.save();

      return res.json({ message: "Job updated successfully", job: job });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error updating job" });
    }
  }

  async activateJob(req, res) {
    try {
      const jobId = req.params?.id;

      if (!jobId) {
        return res.status(404).json({ message: "Job ID must be defined" });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ message: `Job with id ${jobId} could not be found` });
      }

      if (job.author.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not authorized to delete this job" });
      }

      if (job.isActive) {
        return res.status(404).json({ message: "Job is already active" });
      }

      job.isActive = true;

      await job.save();

      return res.json({ message: "Job activated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error deleting job" });
    }
  }

  async deactivateJob(req, res) {
    try {
      const jobId = req.params?.id;

      if (!jobId) {
        return res.status(404).json({ message: "Job ID must be defined" });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ message: `Job with id ${jobId} could not be found` });
      }

      if (job.author.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not authorized to delete this job" });
      }

      if (!job.isActive) {
        return res.status(404).json({ message: "Job is already inactive" });
      }

      job.isActive = false;

      await job.save();

      return res.json({ message: "Job deactivated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error deleting job" });
    }
  }

  async deleteJob(req, res) {
    try {
      const jobId = req.params?.id;

      if (!jobId) {
        return res.status(404).json({ message: "Job ID must be defined" });
      }

      const job = await Job.findById(jobId);

      if (!job) {
        return res.status(404).json({ message: `Job with id ${jobId} could not be found` });
      }

      if (job.author.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not authorized to delete this job" });
      }

      await job.remove();

      return res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error deleting job" });
    }
  }
}

export default new JobsController();
