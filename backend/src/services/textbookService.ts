import mongoose from "mongoose";

const { Types } = mongoose;
type ObjectId = mongoose.Types.ObjectId;
import { Textbook } from "../models/Textbook.js";
import { ApiError } from "../utils/ApiError.js";

export async function getReadyTextbookIds(): Promise<ObjectId[]> {
  const textbooks = await Textbook.find({ status: "ready" }).select("_id").lean();
  return textbooks.map((textbook) => textbook._id);
}

export async function assertReadyTextbook(
  textbookId: string | null | undefined,
): Promise<ObjectId | null> {
  if (!textbookId) return null;

  if (!Types.ObjectId.isValid(textbookId)) {
    throw ApiError.badRequest("The selected textbook is invalid.");
  }

  const textbook = await Textbook.findOne({
    _id: textbookId,
    status: "ready",
  }).select("_id");

  if (!textbook) {
    throw ApiError.notFound("The selected textbook is not ready for tutoring.");
  }

  return textbook._id;
}
