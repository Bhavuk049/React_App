import { Router } from "express";
import { adminLogin, me, requestOtp, verifyOtpCode } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/otp/request", asyncHandler(requestOtp));
router.post("/otp/verify", asyncHandler(verifyOtpCode));
router.post("/admin/login", asyncHandler(adminLogin));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
