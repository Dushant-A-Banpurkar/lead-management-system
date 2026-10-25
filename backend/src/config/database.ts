import mongoose from "mongoose";
import { config } from "./env";

export async function connectDatabase() {
  await mongoose.connect(config.MONGODB_URI);
  console.log("Connected to MongoDB");
}
