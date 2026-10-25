import type { RequestHandler } from "express";
import { User } from "../models/User";

export const listSalesUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await User.find({ role: "sales" }).select("name email").sort({ name: 1 });
    res.json({ users: users.map((user) => ({ id: user.id, name: user.name, email: user.email })) });
  } catch (error) {
    next(error);
  }
};
