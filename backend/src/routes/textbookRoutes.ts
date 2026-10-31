import { Router } from "express";
import { listAvailableTextbooks } from "../controllers/textbookController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(listAvailableTextbooks));

export default router;
