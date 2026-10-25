import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import leadRoutes from "./routes/leadRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const allowedOrigins = new Set([
  config.CLIENT_URL,
  "https://lead-management-system-lake.vercel.app",
]);

app.disable("x-powered-by");
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);
export default app;
