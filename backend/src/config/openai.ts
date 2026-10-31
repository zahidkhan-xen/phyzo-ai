import OpenAI from "openai";
import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

let client: OpenAI | null = null;

export function describeOpenAIError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      return "OpenAI rejected the API key. Check OPENAI_API_KEY and restart the backend.";
    }
    const quotaExhausted =
      error.code === "insufficient_quota" ||
      error.code === "credit_balance_exhausted" ||
      error.type === "insufficient_quota";

    if (error.status === 429 && quotaExhausted) {
      return "The OpenAI account has no remaining credits. Add credits or use a different API key, then reindex.";
    }
    if (error.status === 429) {
      return "OpenAI rate limit reached. Wait a moment and try again.";
    }
    if ((error.status ?? 0) >= 500) {
      return "OpenAI is temporarily unavailable. Try again shortly.";
    }
    return `OpenAI request failed (${error.status ?? "unknown"}): ${error.message}`;
  }
  return error instanceof Error ? error.message : "Unknown OpenAI error";
}

export function getOpenAIClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw ApiError.serviceUnavailable(
      "AI features are not configured yet. Add OPENAI_API_KEY to backend/.env and restart the backend.",
    );
  }

  client ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    maxRetries: 2,
    timeout: 90_000,
  });

  return client;
}
