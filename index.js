import express from "express";
import mongoose from "mongoose";
import authRouter from './authRouter.js';

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use("/auth", authRouter);

const start = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(`mongodb+srv://job-mean-admin:adm123@cluster0.1ooohzg.mongodb.net/?retryWrites=true&w=majority`)
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

start();
