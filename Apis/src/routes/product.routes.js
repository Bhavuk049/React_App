import { Router } from "express";
import {
  adminListProducts,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listProducts));
router.get("/admin", requireAuth, requireAdmin, asyncHandler(adminListProducts));
router.get("/:slug", asyncHandler(getProduct));
router.post("/", requireAuth, requireAdmin, asyncHandler(createProduct));
router.patch("/:id", requireAuth, requireAdmin, asyncHandler(updateProduct));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteProduct));

export default router;
