import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface ICitation {
  textbookId: Types.ObjectId;
  textbookTitle: string;
  pageNumber: number;
  chunkId: Types.ObjectId;
  score: number;
  excerpt: string;
}

export interface IMessageUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  cached: boolean;
}

export interface IMessage {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  citations: ICitation[];
  usage?: IMessageUsage;
  createdAt: Date;
  updatedAt: Date;
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

const usageSchema = new Schema<IMessageUsage>(
  {
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    cached: { type: Boolean, default: false },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: { type: [citationSchema], default: [] },
    usage: { type: usageSchema },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

export const Message: Model<IMessage> =
  (models.Message as Model<IMessage>) ?? model<IMessage>("Message", messageSchema);
