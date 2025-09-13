import mongoose from "mongoose";
import { env } from "../config";
export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI);
}
