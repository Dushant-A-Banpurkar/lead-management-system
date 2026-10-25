import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config/env";
import { User } from "../models/User";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (typeof payload === "string" || !mongoose.isValidObjectId(payload.sub)) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    const user = await User.findById(payload.sub).select("_id role");
    if (!user) {
      res.status(401).json({ message: "Account no longer exists" });
      return;
    }
    req.userId = user._id;
    req.userRole = user.role;
    res.setHeader("Cache-Control", "private, no-store");
    next();
  } catch (error) {
    // JWT failures are authentication errors; database failures must reach the error handler.
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    next(error);
  }
}
