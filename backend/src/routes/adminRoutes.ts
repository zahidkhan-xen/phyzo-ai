import { Router } from "express";
import {
  deleteTextbook,
  listTextbooks,
  reindexTextbook,
  stats,
  updateUser,
  uploadTextbook,
  users,
} from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { uploadPdf } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", asyncHandler(stats));
router.get("/users", asyncHandler(users));
router.patch("/users/:id", asyncHandler(updateUser));

router.get("/textbooks", asyncHandler(listTextbooks));
router.post("/textbooks", uploadPdf.single("file"), asyncHandler(uploadTextbook));
router.post("/textbooks/:id/reindex", asyncHandler(reindexTextbook));
router.delete("/textbooks/:id", asyncHandler(deleteTextbook));

export default router;
