import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(getSettings));
router.patch("/", requireAuth, requireAdmin, asyncHandler(updateSettings));

export default router;
