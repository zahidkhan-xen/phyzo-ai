import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export type UsageKind = "chat" | "chat_cached" | "embedding";

export interface IUsage {
  userId?: Types.ObjectId;
  kind: UsageKind;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  conversationId?: Types.ObjectId;
  createdAt: Date;
}

const usageSchema = new Schema<IUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    kind: {
      type: String,
      enum: ["chat", "chat_cached", "embedding"],
      required: true,
      index: true,
    },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCostUsd: { type: Number, default: 0 },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

usageSchema.index({ createdAt: -1, kind: 1 });

export const Usage: Model<IUsage> =
  (models.Usage as Model<IUsage>) ?? model<IUsage>("Usage", usageSchema);
