import type { Request, Response } from "express";
import { Textbook } from "../models/Textbook.js";
import { serializeTextbook } from "../utils/serialize.js";

export async function listAvailableTextbooks(
  _req: Request,
  res: Response,
): Promise<void> {
  const textbooks = await Textbook.find({ status: "ready" })
    .select("title subject grade description pageCount chunkCount createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    textbooks: textbooks.map((textbook) => ({
      id: String(textbook._id),
      title: textbook.title,
      subject: textbook.subject,
      grade: textbook.grade,
      description: textbook.description,
      pageCount: textbook.pageCount,
      chunkCount: textbook.chunkCount,
      createdAt: textbook.createdAt,
    })),
  });
}

export { serializeTextbook };
