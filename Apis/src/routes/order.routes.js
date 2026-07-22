import { Router } from "express";
import {
  adminDashboardStats,
  adminGetOrder,
  adminListOrders,
  adminUpdateOrderPaymentStatus,
  adminUpdateOrderStatus,
  adminUpdateOrderTracking,
  createOrder,
  createPosSale,
  getMyOrder,
  listMyOrders,
} from "../controllers/order.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", requireAuth, asyncHandler(createOrder));
router.post("/pos", requireAuth, requireAdmin, asyncHandler(createPosSale));
router.get("/me", requireAuth, asyncHandler(listMyOrders));
router.get("/me/:id", requireAuth, asyncHandler(getMyOrder));
router.get("/admin", requireAuth, requireAdmin, asyncHandler(adminListOrders));
router.get("/admin/dashboard-stats", requireAuth, requireAdmin, asyncHandler(adminDashboardStats));
router.get("/admin/:id", requireAuth, requireAdmin, asyncHandler(adminGetOrder));
router.patch("/admin/:id/status", requireAuth, requireAdmin, asyncHandler(adminUpdateOrderStatus));
router.patch("/admin/:id/paid", requireAuth, requireAdmin, asyncHandler(adminUpdateOrderPaymentStatus));
router.patch("/admin/:id/tracking", requireAuth, requireAdmin, asyncHandler(adminUpdateOrderTracking));

export default router;
