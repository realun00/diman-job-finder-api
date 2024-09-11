import Application from "../models/Application.js";
import Job from "../models/Job.js";
import User from "../models/User.js";

class ApplicationController {
  async applyForJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.userId;
      const { coverLetter } = req.body;

      // Check if job is active
      const job = await Job.findById(jobId);
      if (!job || !job.isActive) {
        return res.status(400).json({ message: "Job is not active or does not exist" });
      }

      const isUser = req.user.roles.includes("USER");
      if (!isUser) {
        return res.status(403).json({ message: "Organizations/admins cannot apply for jobs" });
      }

      // Check if user has already applied
      const existingApplication = await Application.findOne({ job: jobId, user: userId });
      if (existingApplication) {
        return res.status(400).json({ message: "You have already applied for this job" });
      }

      // Create the application
      const application = new Application({
        user: userId,
        job: jobId,
        coverLetter,
      });

      // Save the application
      await application.save();

      // Add the application ID to the job's applicants array
      await Job.findByIdAndUpdate(jobId, { $push: { applicants: application._id } });

      return res.status(201).json({ message: "Application submitted successfully", application });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error applying for job" });
    }
  }

  // Get user's applications
  async getUserApplications(req, res) {
    try {
      const userId = req.userId;
      const applications = await Application.find({ user: userId }).populate("job");

      // Format the applications to exclude sensitive fields
      const formattedApplications = applications.map((application) => {
        const job = application.job.toObject(); // Convert the populated job to a plain object
        const applicationObject = application.toObject();

        // Convert likedBy to string array and add isLiked flag
        const likedByIds = job.likedBy.map((id) => id.toString());
        job.isLiked = likedByIds.includes(userId);

        // Exclude sensitive fields
        delete job.likedBy; // Remove the likedBy field
        delete job.author; // Remove the author field
        delete job.applicants; // Remove the applicants

        delete applicationObject.user;

        // Return a new object with the modified job
        return {
          ...applicationObject, // Convert application to a plain object
          job, // Replace the job with the formatted job object
        };
      });

      return res.json(formattedApplications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching applications" });
    }
  }

  async getJobApplicants(req, res) {
    try {
      const jobId = req.params.jobId;

      // Check if job exists
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Ensure the user requesting the information is the author of the job
      if (job.author.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not authorized to view applicants for this job" });
      }

      // Find applications for the job and populate user information
      const applications = await Application.find({ job: jobId })
        .populate("user", "username email firstName lastName") // Populate user details, specify fields as needed

      return res.json(applications);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching applicants" });
    }
  }

  // Update application status (organization only)
  // PATCH: Update application status (organization only)
async updateApplicationStatus(req, res) {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find application by ID and populate job details
    const application = await Application.findById(applicationId).populate("job");
    
    // Check if application exists and if the user is authorized to update it
    if (!application || application.job.author.toString() !== req.userId) {
      return res.status(403).json({ message: "You are not authorized to update this application" });
    }

    // Update the application status
    application.status = status;
    await application.save();

    // Respond with success message and application status
    return res.json({ 
      message: "Application status updated", 
      application: { 
        id: application._id, 
        status: application.status, 
        job: application.job._id 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating application status" });
  }
}

}

export default new ApplicationController();
