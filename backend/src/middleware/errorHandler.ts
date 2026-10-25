import mongoose from "mongoose";
import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (typeof error === "object" && error !== null && "type" in error) {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({ message: "Request body contains invalid JSON" });
      return;
    }
    if (error.type === "entity.too.large") {
      res.status(413).json({ message: "Request body is too large" });
      return;
    }
  }
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      message: "Database validation failed",
      errors: Object.values(error.errors).map((item) => item.message),
    });
    return;
  }
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: "Invalid resource identifier" });
    return;
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
    res.status(409).json({ message: "A record with these details already exists" });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
};
