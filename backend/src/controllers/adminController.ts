import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { AnswerCache } from "../models/AnswerCache.js";
import { Chunk } from "../models/Chunk.js";
import { Conversation } from "../models/Conversation.js";
import { Textbook } from "../models/Textbook.js";
import { User } from "../models/User.js";
import { getAdminStats, listUsers } from "../services/analyticsService.js";
import { deletePdf, savePdfBuffer } from "../services/fileStorage.js";
import { indexTextbook } from "../services/ingestionService.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { serializeTextbook, serializeUser } from "../utils/serialize.js";
import { validate } from "../utils/validate.js";

const uploadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subject: z.string().trim().max(80).optional(),
  grade: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional(),
});

const userUpdateSchema = z.object({
  role: z.enum(["student", "admin"]).optional(),
  dailyMessageLimit: z.coerce.number().int().min(0).max(10000).optional(),
});

function assertPdfSignature(buffer: Buffer): void {
  if (!buffer.subarray(0, 1024).toString("latin1").includes("%PDF-")) {
    throw ApiError.badRequest("The uploaded file is not a valid PDF.");
  }
}

export async function uploadTextbook(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest("Please choose a PDF file to upload.");

  const buffer = req.file.buffer;
  assertPdfSignature(buffer);
  const data = validate(uploadSchema, req.body);
  const storedFileId = await savePdfBuffer(buffer, req.file.originalname);

  let textbook;
  try {
    textbook = await Textbook.create({
      title: data.title,
      subject: data.subject || "Physics",
      grade: data.grade || "",
      description: data.description || "",
      originalName: req.file.originalname,
      storedFileId,
      fileSize: req.file.size,
      status: "processing",
      progress: 0,
      uploadedBy: req.user._id,
    });
  } catch (error) {
    await deletePdf(storedFileId);
    throw error;
  }

  if (env.SYNC_INDEXING) {
    await indexTextbook(String(textbook._id));
    res.status(202).json({
      textbook: serializeTextbook(textbook.toObject()),
      message: "Upload received and indexed.",
    });
    return;
  }

  void indexTextbook(String(textbook._id)).catch((error) => {
    logger.error("Background textbook indexing failed", error);
  });

  res.status(202).json({
    textbook: serializeTextbook(textbook.toObject()),
    message: "Upload received. Indexing has started.",
  });
}

export async function listTextbooks(
  _req: Request,
  res: Response,
): Promise<void> {
  const textbooks = await Textbook.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json({
    textbooks: textbooks.map((textbook) => serializeTextbook(textbook)),
  });
}

export async function reindexTextbook(
  req: Request,
  res: Response,
): Promise<void> {
  const textbook = await Textbook.findById(req.params.id);

  if (!textbook) throw ApiError.notFound("Textbook not found.");
  if (textbook.status === "processing") {
    throw ApiError.conflict("This textbook is already being indexed.");
  }

  await AnswerCache.deleteMany({ textbookIds: textbook._id });

  textbook.status = "processing";
  textbook.progress = 0;
  textbook.error = undefined;
  await textbook.save();

  if (env.SYNC_INDEXING) {
    await indexTextbook(String(textbook._id));
    res.json({
      textbook: serializeTextbook(textbook.toObject()),
      message: "Reindexing completed.",
    });
    return;
  }

  void indexTextbook(String(textbook._id)).catch((error) => {
    logger.error("Background textbook reindexing failed", error);
  });

  res.json({
    textbook: serializeTextbook(textbook.toObject()),
    message: "Reindexing has started.",
  });
}

export async function deleteTextbook(
  req: Request,
  res: Response,
): Promise<void> {
  const textbook = await Textbook.findById(req.params.id).select("+storedFileId");

  if (!textbook) throw ApiError.notFound("Textbook not found.");
  if (textbook.status === "processing") {
    throw ApiError.conflict(
      "This textbook is still indexing. Wait for it to finish before deleting it.",
    );
  }

  await Promise.all([
    Chunk.deleteMany({ textbookId: textbook._id }),
    AnswerCache.deleteMany({ textbookIds: textbook._id }),
    Conversation.updateMany(
      { textbookId: textbook._id },
      { $set: { textbookId: null } },
    ),
  ]);

  await deletePdf(textbook.storedFileId);
  await textbook.deleteOne();

  res.json({ message: "Textbook deleted." });
}

export async function stats(_req: Request, res: Response): Promise<void> {
  res.json(await getAdminStats());
}

export async function users(_req: Request, res: Response): Promise<void> {
  const allUsers = await listUsers();
  res.json({
    users: allUsers.map((user) => serializeUser(user)),
  });
}

export async function updateUser(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const data = validate(userUpdateSchema, req.body);
  const user = await User.findById(req.params.id);

  if (!user) throw ApiError.notFound("User not found.");

  if (
    String(user._id) === String(req.user._id) &&
    data.role === "student"
  ) {
    throw ApiError.badRequest("You cannot remove your own administrator access.");
  }

  if (data.role !== undefined) user.role = data.role;
  if (data.dailyMessageLimit !== undefined) {
    user.dailyMessageLimit = data.dailyMessageLimit;
  }

  await user.save();

  res.json({ user: serializeUser(user.toObject()) });
}
