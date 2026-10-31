import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;
import type { ICitation } from "./Message.js";

export interface IAnswerCache {
  key: string;
  answer: string;
  citations: ICitation[];
  model: string;
  textbookIds: Types.ObjectId[];
  createdAt: Date;
  expiresAt: Date;
}

const citationSchema = new Schema<ICitation>(
  {
    textbookId: { type: Schema.Types.ObjectId, ref: "Textbook", required: true },
    textbookTitle: { type: String, required: true },
    pageNumber: { type: Number, required: true },
    chunkId: { type: Schema.Types.ObjectId, ref: "Chunk", required: true },
    score: { type: Number, default: 0 },
    excerpt: { type: String, default: "" },
  },
  { _id: false },
);

const answerCacheSchema = new Schema<IAnswerCache>(
  {
    key: { type: String, required: true, unique: true, index: true },
    answer: { type: String, required: true },
    citations: { type: [citationSchema], default: [] },
    model: { type: String, required: true },
    textbookIds: { type: [Schema.Types.ObjectId], default: [] },
    createdAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: false },
);

export const AnswerCache: Model<IAnswerCache> =
  (models.AnswerCache as Model<IAnswerCache>) ??
  model<IAnswerCache>("AnswerCache", answerCacheSchema);
