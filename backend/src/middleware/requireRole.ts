import type { RequestHandler } from "express";

export function requireRole(role: "admin" | "sales"): RequestHandler {
  return (req, res, next) => {
    if (req.userRole !== role) {
      res.status(403).json({ message: "You do not have permission to perform this action" });
      return;
    }
    next();
  };
}
