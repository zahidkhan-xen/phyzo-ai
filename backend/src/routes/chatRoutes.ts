import { Router } from "express";
import { sendMessage } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimiters.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", requireAuth, chatLimiter, asyncHandler(sendMessage));

export default router;
