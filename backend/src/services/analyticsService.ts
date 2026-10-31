import type { Types } from "mongoose";
import { Chunk } from "../models/Chunk.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Textbook } from "../models/Textbook.js";
import { Usage } from "../models/Usage.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getDailyMessageCount(userId: Types.ObjectId): Promise<number> {
  return Usage.countDocuments({
    userId,
    kind: { $in: ["chat", "chat_cached"] },
    createdAt: { $gte: startOfToday() },
  });
}

export async function getDailyLimit(user: {
  dailyMessageLimit: number;
}): Promise<number> {
  return user.dailyMessageLimit > 0
    ? user.dailyMessageLimit
    : env.DAILY_MESSAGE_LIMIT;
}

interface UsageSummary {
  requests: number;
  cachedRequests: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

function emptyUsage(): UsageSummary {
  return {
    requests: 0,
    cachedRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
  };
}

async function usageSummary(since?: Date): Promise<UsageSummary> {
  const match = since ? { createdAt: { $gte: since } } : {};
  const rows = await Usage.aggregate<{
    _id: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: "$kind",
        requests: { $sum: 1 },
        inputTokens: { $sum: "$inputTokens" },
        outputTokens: { $sum: "$outputTokens" },
        cost: { $sum: "$estimatedCostUsd" },
      },
    },
  ]);

  const summary = emptyUsage();

  for (const row of rows) {
    if (row._id === "chat") {
      summary.requests += row.requests;
      summary.inputTokens += row.inputTokens;
      summary.outputTokens += row.outputTokens;
      summary.estimatedCostUsd += row.cost;
    } else if (row._id === "chat_cached") {
      summary.cachedRequests += row.requests;
    } else if (row._id === "embedding") {
      summary.inputTokens += row.inputTokens;
      summary.estimatedCostUsd += row.cost;
    }
  }

  return summary;
}

export async function getAdminStats() {
  const [
    users,
    admins,
    conversations,
    messages,
    textbookCounts,
    chunks,
    usageToday,
    usageAllTime,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    Conversation.countDocuments(),
    Message.countDocuments(),
    Textbook.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Chunk.countDocuments(),
    usageSummary(startOfToday()),
    usageSummary(),
  ]);

  const textbookStatus = { ready: 0, processing: 0, failed: 0 };
  const totalTextbooks = textbookCounts.reduce((total, row) => total + row.count, 0);
  for (const row of textbookCounts) {
    if (row._id === "ready" || row._id === "processing" || row._id === "failed") {
      textbookStatus[row._id] = row.count;
    }
  }

  return {
    users,
    admins,
    conversations,
    messages,
    chunks,
    textbooks: {
      total: totalTextbooks,
      ...textbookStatus,
    },
    usageToday,
    usageAllTime,
  };
}

export async function listUsers() {
  return User.find()
    .select("name email role dailyMessageLimit createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
}
