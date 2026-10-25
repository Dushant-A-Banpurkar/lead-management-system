import type { Types } from "mongoose";
import type { Request } from "express";
import type { z } from "zod";
import type { leadFilterSchema } from "./validation";

type LeadFilters = z.infer<typeof leadFilterSchema>;

export function buildLeadFilter(
  filters: LeadFilters,
  userId: Types.ObjectId,
  userRole: Request["userRole"],
) {
  const filter: Record<string, unknown> = {};
  if (userRole !== "admin") filter.owner = userId;
  else if (filters.ownerId) filter.owner = filters.ownerId;
  if (filters.status) filter.status = filters.status;
  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["name", "email", "phone"].map((field) => ({ [field]: { $regex: escaped, $options: "i" } }));
  }
  if (filters.from || filters.to) {
    const createdAt: Record<string, Date> = {};
    if (filters.from) createdAt.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) createdAt.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    filter.createdAt = createdAt;
  }
  return filter;
}
