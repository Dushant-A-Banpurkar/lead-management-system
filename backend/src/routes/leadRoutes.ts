import { Router } from "express";
import {
  createLead,
  deleteLead,
  exportLeadsCsv,
  getActivityFeed,
  getLeadActivity,
  getLeadStats,
  listLeads,
  updateLead,
} from "../controllers/leadController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/stats", getLeadStats);
router.get("/export.csv", exportLeadsCsv);
router.get("/activity", getActivityFeed);
router.get("/", listLeads);
router.post("/", createLead);
router.get("/:id/activity", getLeadActivity);
router.patch("/:id", updateLead);
router.delete("/:id", deleteLead);

export default router;
