import { z } from "zod";
import { leadStatuses } from "../models/Lead";

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

export const leadSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().default(""),
  company: z.string().trim().max(120).optional().default(""),
  serviceInterested: z.string().trim().max(120).optional().default(""),
  status: z.enum(leadStatuses).optional().default("New"),
  followUpDate: z.union([z.string().datetime(), z.literal(""), z.null()]).optional().transform((value) =>
    value ? new Date(value) : null,
  ),
  notes: z.string().trim().max(5000).optional().default(""),
});

export const leadFilterSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(leadStatuses).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  ownerId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid owner ID").optional(),
});

export const leadQuerySchema = leadFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "name", "followUpDate", "status"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
