import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IChunk {
  textbookId: Types.ObjectId;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  contentHash: string;
  tokenCount: number;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const chunkSchema = new Schema<IChunk>(
  {
    textbookId: {
      type: Schema.Types.ObjectId,
      ref: "Textbook",
      required: true,
      index: true,
    },
    pageNumber: { type: Number, required: true, min: 1 },
    chunkIndex: { type: Number, required: true, min: 0 },
    text: { type: String, required: true },
    contentHash: { type: String, required: true, index: true },
    tokenCount: { type: Number, default: 0 },
    embedding: { type: [Number], default: [], select: false },
  },
  { timestamps: true },
);

chunkSchema.index({ textbookId: 1, chunkIndex: 1 }, { unique: true });

export const Chunk: Model<IChunk> =
  (models.Chunk as Model<IChunk>) ?? model<IChunk>("Chunk", chunkSchema);
