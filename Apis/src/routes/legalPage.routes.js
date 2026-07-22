import { Router } from "express";
import {
  adminListLegalPages,
  adminUpdateLegalPage,
  getLegalPage,
  listLegalPages,
} from "../controllers/legalPage.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listLegalPages));
router.get("/admin", requireAuth, requireAdmin, asyncHandler(adminListLegalPages));
router.get("/:slug", asyncHandler(getLegalPage));
router.patch("/:slug", requireAuth, requireAdmin, asyncHandler(adminUpdateLegalPage));

export default router;
