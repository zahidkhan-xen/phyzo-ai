import mongoose, { type Model, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

export interface IConversation {
  userId: Types.ObjectId;
  title: string;
  textbookId?: Types.ObjectId | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    textbookId: {
      type: Schema.Types.ObjectId,
      ref: "Textbook",
      default: null,
    },
    lastMessageAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });

export const Conversation: Model<IConversation> =
  (models.Conversation as Model<IConversation>) ??
  model<IConversation>("Conversation", conversationSchema);
