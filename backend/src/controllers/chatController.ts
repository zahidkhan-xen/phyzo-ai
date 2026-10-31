import mongoose from "mongoose";

const { Types } = mongoose;
type ObjectId = mongoose.Types.ObjectId;
import type { Request, Response } from "express";
import { z } from "zod";
import { chatModel, env } from "../config/env.js";
import { AnswerCache } from "../models/AnswerCache.js";
import { Conversation } from "../models/Conversation.js";
import { Message, type ICitation } from "../models/Message.js";
import { Usage } from "../models/Usage.js";
import { REFUSAL_MESSAGE, generateAnswer } from "../services/aiService.js";
import {
  buildCitationExcerpt,
  retrieveContext,
  type RetrievedChunk,
} from "../services/retrievalService.js";
import {
  getDailyLimit,
  getDailyMessageCount,
} from "../services/analyticsService.js";
import {
  assertReadyTextbook,
  getReadyTextbookIds,
} from "../services/textbookService.js";
import { ApiError } from "../utils/ApiError.js";
import { roundCost } from "../utils/cost.js";
import {
  serializeConversation,
  serializeMessage,
} from "../utils/serialize.js";
import { hashText, normalizeQuestion, truncate } from "../utils/text.js";
import { validate } from "../utils/validate.js";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().optional(),
  textbookId: z.string().nullable().optional(),
});

function toCitations(chunks: RetrievedChunk[]): ICitation[] {
  return chunks.map((chunk) => ({
    textbookId: new Types.ObjectId(chunk.textbookId),
    textbookTitle: chunk.textbookTitle,
    pageNumber: chunk.pageNumber,
    chunkId: new Types.ObjectId(chunk.chunkId),
    score: chunk.score,
    excerpt: buildCitationExcerpt(chunk.text),
  }));
}

function cacheKey(
  question: string,
  textbookIds: ObjectId[],
  chunks: RetrievedChunk[],
): string {
  return hashText(
    [
      normalizeQuestion(question),
      textbookIds.map(String).sort().join(","),
      chunks.map((chunk) => chunk.chunkId).sort().join(","),
      chatModel,
    ].join("|"),
  );
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();

  const data = validate(chatSchema, req.body);
  const userId = req.user._id;

  const [dailyCount, dailyLimit] = await Promise.all([
    getDailyMessageCount(userId),
    getDailyLimit(req.user),
  ]);

  if (dailyCount >= dailyLimit) {
    throw ApiError.tooManyRequests(
      `You have reached today's limit of ${dailyLimit} questions. Please try again tomorrow.`,
    );
  }

  let conversation = data.conversationId
    ? await Conversation.findOne({ _id: data.conversationId, userId })
    : null;

  if (data.conversationId && !conversation) {
    throw ApiError.notFound("Conversation not found.");
  }

  if (!conversation) {
    const derivedTitle = truncate(data.message.replace(/\s+/g, " "), 70);
    conversation = await Conversation.create({
      userId,
      title: derivedTitle,
      textbookId: null,
      lastMessageAt: new Date(),
    });
  }

  if (data.textbookId !== undefined) {
    conversation.textbookId = await assertReadyTextbook(data.textbookId);
  }

  const historyDocs = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const history = historyDocs
    .reverse()
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const previousQuestion = [...history]
    .reverse()
    .find((message) => message.role === "user")?.content;

  const retrievalQuery = truncate(
    previousQuestion ? `${previousQuestion}\n${data.message}` : data.message,
    2000,
  );

  const textbookIds = conversation.textbookId
    ? [conversation.textbookId]
    : await getReadyTextbookIds();

  if (textbookIds.length === 0) {
    throw ApiError.conflict(
      "No textbook is ready yet. Ask an administrator to upload and index a textbook first.",
    );
  }

  const chunks = await retrieveContext({
    query: retrievalQuery,
    textbookIds,
  });

  const userMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: "user",
    content: data.message,
  });

  if (conversation.title === "New conversation") {
    conversation.title = truncate(data.message.replace(/\s+/g, " "), 70);
  }

  conversation.lastMessageAt = new Date();
  await conversation.save();

  let answerText: string;
  let citations: ICitation[] = [];
  let model = chatModel;
  let inputTokens = 0;
  let outputTokens = 0;
  let estimatedCostUsd = 0;
  let cached = false;

  if (chunks.length === 0) {
    answerText = REFUSAL_MESSAGE;
  } else {
    const key = cacheKey(data.message, textbookIds, chunks);
    const cachedAnswer =
      history.length === 0 ? await AnswerCache.findOne({ key }).lean() : null;

    if (cachedAnswer && cachedAnswer.expiresAt > new Date()) {
      answerText = cachedAnswer.answer;
      citations = cachedAnswer.citations;
      model = cachedAnswer.model;
      cached = true;
    } else {
      const generated = await generateAnswer({
        question: data.message,
        history,
        chunks,
      });

      answerText = generated.answer;
      citations = generated.refusal ? [] : toCitations(generated.citations);
      model = generated.model;
      inputTokens = generated.inputTokens;
      outputTokens = generated.outputTokens;
      estimatedCostUsd = generated.estimatedCostUsd;

      if (!generated.refusal && history.length === 0) {
        const expiresAt = new Date(
          Date.now() + env.ANSWER_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
        );
        await AnswerCache.create({
          key,
          answer: generated.answer,
          citations,
          model: generated.model,
          textbookIds,
          expiresAt,
        }).catch(() => undefined);
      }
    }
  }

  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    userId,
    role: "assistant",
    content: answerText,
    citations,
    usage: {
      model,
      inputTokens,
      outputTokens,
      estimatedCostUsd: roundCost(estimatedCostUsd),
      cached,
    },
  });

  await Usage.create({
    userId,
    kind: cached ? "chat_cached" : "chat",
    model,
    inputTokens,
    outputTokens,
    estimatedCostUsd: roundCost(cached ? 0 : estimatedCostUsd),
    conversationId: conversation._id,
  });

  res.json({
    conversation: serializeConversation(conversation.toObject()),
    userMessage: serializeMessage(userMessage.toObject()),
    assistantMessage: serializeMessage(assistantMessage.toObject()),
    cached,
    remainingMessages: Math.max(0, dailyLimit - dailyCount - 1),
  });
}
