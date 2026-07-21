import { Router } from "express";
import {
  adminGetProduct,
  adminListProducts,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { processProductImages, uploadProductImages } from "../middleware/upload.js";

const router = Router();

router.get("/", asyncHandler(listProducts));
router.get("/admin", requireAuth, requireAdmin, asyncHandler(adminListProducts));
router.get("/admin/:id", requireAuth, requireAdmin, asyncHandler(adminGetProduct));
router.get("/:slug", asyncHandler(getProduct));
router.post(
  "/",
  requireAuth,
  requireAdmin,
  uploadProductImages,
  processProductImages,
  asyncHandler(createProduct),
);
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  uploadProductImages,
  processProductImages,
  asyncHandler(updateProduct),
);
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteProduct));

export default router;
