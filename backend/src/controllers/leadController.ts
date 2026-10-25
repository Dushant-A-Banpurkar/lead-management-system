import type { RequestHandler } from "express";
import { z } from "zod";
import { Lead, leadStatuses } from "../models/Lead";
import { LeadActivity } from "../models/LeadActivity";
import { User } from "../models/User";
import { buildLeadFilter } from "../utils/leadFilter";
import { rowsToCsv } from "../utils/csv";
import { leadFilterSchema, leadQuerySchema, leadSchema } from "../utils/validation";

const assignedLeadSchema = leadSchema.extend({
  ownerId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid owner ID").optional(),
});

export const getLeadStats: RequestHandler = async (req, res, next) => {
  try {
    const counts = await Lead.aggregate([
      ...(req.userRole === "admin" ? [] : [{ $match: { owner: req.userId } }]),
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byStatus = Object.fromEntries(leadStatuses.map((status) => [status, 0]));
    for (const item of counts) byStatus[item._id] = item.count;
    res.json({ total: Object.values(byStatus).reduce((sum, count) => sum + count, 0), byStatus });
  } catch (error) {
    next(error);
  }
};

export const listLeads: RequestHandler = async (req, res, next) => {
  const parsed = leadQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid lead filters", errors: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const { page, limit, sortBy, order } = parsed.data;
    const filter = buildLeadFilter(parsed.data, req.userId!, req.userRole);
    const [leads, total] = await Promise.all([
      Lead.find(filter).populate("owner", "name email").sort({ [sortBy]: order === "asc" ? 1 : -1 }).skip((page - 1) * limit).limit(limit),
      Lead.countDocuments(filter),
    ]);
    res.json({ leads, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const createLead: RequestHandler = async (req, res, next) => {
  const parsed = assignedLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid lead details", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const { ownerId, ...leadData } = parsed.data;
    if (ownerId && req.userRole !== "admin") {
      res.status(403).json({ message: "Only admins can assign leads to another user" });
      return;
    }
    if (ownerId && !(await User.exists({ _id: ownerId, role: "sales" }))) {
      res.status(400).json({ message: "Assigned user does not exist or is not a sales user" });
      return;
    }
    const owner = ownerId ?? req.userId;
    const lead = await Lead.create({ ...leadData, owner });
    await LeadActivity.create({
      leadId: lead._id,
      owner,
      actor: req.userId,
      leadName: lead.name,
      action: "created",
    });
    res.status(201).json({ lead });
  } catch (error) {
    next(error);
  }
};

export const updateLead: RequestHandler = async (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    res.status(400).json({ message: "Invalid lead ID" });
    return;
  }
  const parsed = assignedLeadSchema.partial().safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({
      message: "Invalid lead details",
      ...(parsed.success ? {} : { errors: parsed.error.flatten().fieldErrors }),
    });
    return;
  }
  try {
    const { ownerId, ...leadChanges } = parsed.data;
    if (ownerId && req.userRole !== "admin") {
      res.status(403).json({ message: "Only admins can reassign leads" });
      return;
    }
    if (ownerId && !(await User.exists({ _id: ownerId, role: "sales" }))) {
      res.status(400).json({ message: "Assigned user does not exist or is not a sales user" });
      return;
    }
    const scope = req.userRole === "admin" ? {} : { owner: req.userId };
    const currentLead = await Lead.findOne({ _id: req.params.id, ...scope });
    if (!currentLead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    const changedFields = Object.entries(leadChanges)
      .filter(([key, value]) => String(currentLead.get(key)) !== String(value))
      .map(([key]) => key);
    if (ownerId && String(currentLead.owner) !== ownerId) changedFields.push("owner");
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, ...scope },
      { $set: { ...leadChanges, ...(ownerId ? { owner: ownerId } : {}) } },
      { new: true, runValidators: true },
    );
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    if (changedFields.length > 0) {
      await LeadActivity.create({
        leadId: lead._id,
        owner: lead.owner,
        actor: req.userId,
        leadName: lead.name,
        action: "updated",
        changedFields,
      });
    }
    res.json({ lead });
  } catch (error) {
    next(error);
  }
};

export const deleteLead: RequestHandler = async (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    res.status(400).json({ message: "Invalid lead ID" });
    return;
  }
  try {
    const scope = req.userRole === "admin" ? {} : { owner: req.userId };
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, ...scope });
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    await LeadActivity.create({
      leadId: lead._id,
      owner: lead.owner,
      actor: req.userId,
      leadName: lead.name,
      action: "deleted",
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const exportLeadsCsv: RequestHandler = async (req, res, next) => {
  const parsed = leadFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid lead filters", errors: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const leads = await Lead.find(buildLeadFilter(parsed.data, req.userId!, req.userRole))
      .populate("owner", "name")
      .sort({ createdAt: -1 });
    const csv = rowsToCsv([
      ["Name", "Email", "Phone", "Company", "Service Interested", "Status", "Follow-up Date", "Notes", "Owner", "Created At"],
      ...leads.map((lead) => [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.serviceInterested,
        lead.status,
        lead.followUpDate?.toISOString(),
        lead.notes,
        typeof lead.owner === "object" && "name" in lead.owner ? lead.owner.name : "",
        lead.createdAt.toISOString(),
      ]),
    ]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="leads.csv"');
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
};

export const getLeadActivity: RequestHandler = async (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    res.status(400).json({ message: "Invalid lead ID" });
    return;
  }
  try {
    const scope = req.userRole === "admin" ? {} : { owner: req.userId };
    const lead = await Lead.findOne({ _id: req.params.id, ...scope });
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    const activities = await LeadActivity.find({ leadId: lead._id })
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
};

export const getActivityFeed: RequestHandler = async (req, res, next) => {
  try {
    const filter = req.userRole === "admin" ? {} : { owner: req.userId };
    const activities = await LeadActivity.find(filter)
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
};
