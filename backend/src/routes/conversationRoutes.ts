import { Router } from "express";
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  updateConversation,
} from "../controllers/conversationController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listConversations));
router.post("/", asyncHandler(createConversation));
router.get("/:id", asyncHandler(getConversation));
router.patch("/:id", asyncHandler(updateConversation));
router.delete("/:id", asyncHandler(deleteConversation));

export default router;
