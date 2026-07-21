import { Router } from "express";
import {
  adminGetUser,
  adminListUsers,
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  updateProfile,
} from "../controllers/user.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/admin", requireAuth, requireAdmin, asyncHandler(adminListUsers));
router.get("/admin/:id", requireAuth, requireAdmin, asyncHandler(adminGetUser));

router.patch("/me", requireAuth, asyncHandler(updateProfile));
router.get("/me/addresses", requireAuth, asyncHandler(listAddresses));
router.post("/me/addresses", requireAuth, asyncHandler(createAddress));
router.patch("/me/addresses/:id", requireAuth, asyncHandler(updateAddress));
router.delete("/me/addresses/:id", requireAuth, asyncHandler(deleteAddress));

export default router;
