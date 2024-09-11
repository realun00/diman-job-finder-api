import express from "express";
import mongoose from "mongoose";
import cors from "cors"; // Import the cors middleware
import authRouter from "./routes/authRouter.js";
import jobsRouter from "./routes/jobsRouter.js";
import applicationRouter from './routes/applicationRouter.js'

const PORT = process.env.PORT || 5000;

const app = express();
// Enable CORS for all routes or specify the origin
app.use(cors({
  origin: '*', // Allow requests from Angular app
  credentials: true // If you need to allow cookies, set this to true
}));

app.use(express.json());
app.use("/auth", authRouter);
app.use("/jobs", jobsRouter);
app.use("/application", applicationRouter);

const start = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      `mongodb+srv://job-mean-admin:adm123@cluster0.1ooohzg.mongodb.net/?retryWrites=true&w=majority`
    );
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

start();
