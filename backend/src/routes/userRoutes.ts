import { Router } from "express";
import { listSalesUsers } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/sales", listSalesUsers);

export default router;
