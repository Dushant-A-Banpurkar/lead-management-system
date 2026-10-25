import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { User } from "../models/User";
import { issueToken } from "../utils/token";
import { loginSchema, registrationSchema } from "../utils/validation";

export const register: RequestHandler = async (req, res, next) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid registration details", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const email = parsed.data.email.toLowerCase();
    if (await User.exists({ email })) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }
    const password = await bcrypt.hash(parsed.data.password, 12);
    const user = await User.create({ name: parsed.data.name, email, password });
    res.status(201).json({
      token: issueToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid login details", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+password");
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
      res.status(401).json({ message: "Email or password is incorrect" });
      return;
    }
    res.json({
      token: issueToken(user.id),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name email role");
    if (!user) {
      res.status(401).json({ message: "Account no longer exists" });
      return;
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};
