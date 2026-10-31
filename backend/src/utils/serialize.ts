import type { Types } from "mongoose";
import type { ICitation, IMessageUsage } from "../models/Message.js";

interface UserLike {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  dailyMessageLimit: number;
  createdAt: Date;
}

interface ConversationLike {
  _id: Types.ObjectId;
  title: string;
  textbookId?: Types.ObjectId | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageLike {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: string;
  content: string;
  citations?: ICitation[];
  usage?: IMessageUsage | null;
  createdAt: Date;
}

interface TextbookLike {
  _id: Types.ObjectId;
  title: string;
  subject: string;
  grade: string;
  description: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  chunkCount: number;
  status: string;
  progress: number;
  error?: string;
  embeddingTokens: number;
  embeddingCostUsd: number;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeUser(user: UserLike) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    dailyMessageLimit: user.dailyMessageLimit,
    createdAt: user.createdAt,
  };
}

export function serializeConversation(conversation: ConversationLike) {
  return {
    id: String(conversation._id),
    title: conversation.title,
    textbookId: conversation.textbookId
      ? String(conversation.textbookId)
      : null,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export function serializeMessage(message: MessageLike) {
  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    role: message.role,
    content: message.content,
    citations: message.citations ?? [],
    usage: message.usage ?? null,
    createdAt: message.createdAt,
  };
}

export function serializeTextbook(textbook: TextbookLike) {
  return {
    id: String(textbook._id),
    title: textbook.title,
    subject: textbook.subject,
    grade: textbook.grade,
    description: textbook.description,
    originalName: textbook.originalName,
    fileSize: textbook.fileSize,
    pageCount: textbook.pageCount,
    chunkCount: textbook.chunkCount,
    status: textbook.status,
    progress: textbook.progress,
    error: textbook.error ?? null,
    embeddingTokens: textbook.embeddingTokens,
    embeddingCostUsd: textbook.embeddingCostUsd,
    createdAt: textbook.createdAt,
    updatedAt: textbook.updatedAt,
  };
}
