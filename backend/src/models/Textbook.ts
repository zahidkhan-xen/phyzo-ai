import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export type TextbookStatus = "processing" | "ready" | "failed";

export interface ITextbook {
  title: string;
  subject: string;
  grade: string;
  description: string;
  originalName: string;
  storedFileId: string;
  fileSize: number;
  pageCount: number;
  chunkCount: number;
  status: TextbookStatus;
  progress: number;
  error?: string;
  embeddingTokens: number;
  embeddingCostUsd: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const textbookSchema = new Schema<ITextbook>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, default: "Physics", trim: true, maxlength: 80 },
    grade: { type: String, default: "", trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    originalName: { type: String, required: true },
    storedFileId: { type: String, required: true, select: false },
    fileSize: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    error: { type: String },
    embeddingTokens: { type: Number, default: 0 },
    embeddingCostUsd: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

textbookSchema.index({ status: 1, createdAt: -1 });

export const Textbook: Model<ITextbook> =
  (models.Textbook as Model<ITextbook>) ??
  model<ITextbook>("Textbook", textbookSchema);
