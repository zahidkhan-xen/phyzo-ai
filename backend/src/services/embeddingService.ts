import OpenAI from "openai";
import {
  aiProvider,
  embeddingDimensions,
  embeddingModel,
  env,
} from "../config/env.js";
import { describeOpenAIError, getOpenAIClient } from "../config/openai.js";
import { ApiError } from "../utils/ApiError.js";
import { estimateTokens } from "../utils/text.js";
import { logger } from "../utils/logger.js";
import {
  embedTextsWithGemini,
  type GeminiEmbeddingTask,
} from "./geminiService.js";

const EMBEDDING_BATCH_SIZE = 64;
const MAX_ATTEMPTS = 3;

export interface EmbeddingBatchResult {
  embeddings: number[][];
  tokens: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    if (
      error.code === "insufficient_quota" ||
      error.code === "credit_balance_exhausted" ||
      error.type === "insufficient_quota"
    ) {
      return false;
    }
    return error.status === 429 || (error.status ?? 0) >= 500;
  }
  return false;
}

async function createEmbeddingBatch(texts: string[]): Promise<EmbeddingBatchResult> {
  const client = getOpenAIClient();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.embeddings.create({
        model: embeddingModel,
        input: texts,
        dimensions: embeddingDimensions,
      });

      const embeddings = [...response.data]
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      if (embeddings.length !== texts.length) {
        throw new ApiError(502, "The embedding provider returned an incomplete batch.");
      }

      return {
        embeddings,
        tokens:
          response.usage?.total_tokens ??
          texts.reduce((total, text) => total + estimateTokens(text), 0),
      };
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isRetryable(error)) {
        const delay = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 300);
        logger.warn(`Embedding request failed; retrying in ${delay}ms`, error);
        await sleep(delay);
        continue;
      }

      if (error instanceof ApiError) throw error;
      logger.error("Embedding request failed", error);
      throw new ApiError(
        502,
        `OpenAI embedding request failed: ${describeOpenAIError(error)}`,
      );
    }
  }

  throw new ApiError(502, "Embedding service unavailable.");
}

export async function embedTexts(
  texts: string[],
  taskType: GeminiEmbeddingTask = "RETRIEVAL_DOCUMENT",
): Promise<EmbeddingBatchResult> {
  if (texts.length === 0) {
    return { embeddings: [], tokens: 0 };
  }

  if (aiProvider === "gemini") {
    return embedTextsWithGemini(texts, taskType);
  }

  const embeddings: number[][] = [];
  let tokens = 0;

  for (let start = 0; start < texts.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBEDDING_BATCH_SIZE);
    const result = await createEmbeddingBatch(batch);
    embeddings.push(...result.embeddings);
    tokens += result.tokens;
  }

  return { embeddings, tokens };
}

export async function embedQuery(text: string): Promise<number[]> {
  const result = await embedTexts([text], "RETRIEVAL_QUERY");
  return result.embeddings[0] ?? [];
}
