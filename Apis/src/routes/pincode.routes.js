import { Router } from "express";
import { lookupPincode } from "../controllers/pincode.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/:code", asyncHandler(lookupPincode));

export default router;
