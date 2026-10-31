import type { Request, Response } from "express";
import { z } from "zod";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { ApiError } from "../utils/ApiError.js";
import {
  serializeConversation,
  serializeMessage,
} from "../utils/serialize.js";
import { validate } from "../utils/validate.js";
import { assertReadyTextbook } from "../services/textbookService.js";

const createSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  textbookId: z.string().nullable().optional(),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  textbookId: z.string().nullable().optional(),
});

export async function listConversations(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const conversations = await Conversation.find({ userId: req.user._id })
    .sort({ lastMessageAt: -1 })
    .limit(100)
    .lean();

  res.json({
    conversations: conversations.map((conversation) =>
      serializeConversation(conversation),
    ),
  });
}

export async function createConversation(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const data = validate(createSchema, req.body);
  const textbookId = await assertReadyTextbook(data.textbookId);

  const conversation = await Conversation.create({
    userId: req.user._id,
    title: data.title ?? "New conversation",
    textbookId,
    lastMessageAt: new Date(),
  });

  res.status(201).json({
    conversation: serializeConversation(conversation.toObject()),
  });
}

export async function getConversation(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).lean();

  if (!conversation) throw ApiError.notFound("Conversation not found.");

  const messages = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .lean();

  res.json({
    conversation: serializeConversation(conversation),
    messages: messages.map((message) => serializeMessage(message)),
  });
}

export async function updateConversation(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const data = validate(updateSchema, req.body);
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) throw ApiError.notFound("Conversation not found.");

  if (data.title !== undefined) conversation.title = data.title;
  if (data.textbookId !== undefined) {
    conversation.textbookId = await assertReadyTextbook(data.textbookId);
  }

  await conversation.save();

  res.json({ conversation: serializeConversation(conversation.toObject()) });
}

export async function deleteConversation(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!conversation) throw ApiError.notFound("Conversation not found.");

  await Message.deleteMany({ conversationId: conversation._id });
  await conversation.deleteOne();

  res.json({ message: "Conversation deleted." });
}
