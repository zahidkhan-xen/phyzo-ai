import { env } from "../config/env.js";
import {
  GeminiApiError,
  describeGeminiError,
  geminiRequest,
} from "../config/gemini.js";
import { ApiError } from "../utils/ApiError.js";
import { estimateTokens } from "../utils/text.js";
import { logger } from "../utils/logger.js";

const MAX_ATTEMPTS = 3;
const EMBEDDING_BATCH_SIZE = 64;

export type GeminiEmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

interface GeminiEmbeddingResponse {
  embeddings?: Array<{ values?: number[] }>;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string; thought?: boolean }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export interface GeminiTextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  return (
    error instanceof GeminiApiError &&
    (error.status === 429 || error.status >= 500)
  );
}

async function withRetry<T>(
  operation: () => Promise<T>,
  label: string,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt < MAX_ATTEMPTS && isRetryable(error)) {
        const delay = 800 * 2 ** (attempt - 1) + Math.floor(Math.random() * 300);
        logger.warn(`${label} failed; retrying in ${delay}ms`, error);
        await sleep(delay);
        continue;
      }

      if (error instanceof ApiError) throw error;
      logger.error(`${label} failed`, error);
      throw new ApiError(502, `${label} failed: ${describeGeminiError(error)}`);
    }
  }

  throw new ApiError(502, `${label} failed: Gemini service unavailable.`);
}

export async function embedTextsWithGemini(
  texts: string[],
  taskType: GeminiEmbeddingTask = "RETRIEVAL_DOCUMENT",
): Promise<{ embeddings: number[][]; tokens: number }> {
  const embeddings: number[][] = [];
  let tokens = 0;

  for (let start = 0; start < texts.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(start, start + EMBEDDING_BATCH_SIZE);
    const data = await withRetry(
      () =>
        geminiRequest<GeminiEmbeddingResponse>(
          `models/${env.GEMINI_EMBEDDING_MODEL}:batchEmbedContents`,
          {
            requests: batch.map((text) => ({
              model: `models/${env.GEMINI_EMBEDDING_MODEL}`,
              content: { parts: [{ text }] },
              taskType,
              outputDimensionality: env.GEMINI_EMBEDDING_DIMENSIONS,
            })),
          },
        ),
      "Gemini embedding request",
    );

    const batchEmbeddings = (data.embeddings ?? []).map(
      (embedding) => embedding.values ?? [],
    );

    if (
      batchEmbeddings.length !== batch.length ||
      batchEmbeddings.some((embedding) => embedding.length === 0)
    ) {
      throw new ApiError(502, "Gemini returned an incomplete embedding batch.");
    }

    embeddings.push(...batchEmbeddings);
    tokens += batch.reduce((total, text) => total + estimateTokens(text), 0);
  }

  return { embeddings, tokens };
}

export async function generateTextWithGemini(
  instructions: string,
  input: string,
): Promise<GeminiTextResult> {
  const data = await withRetry(
    () =>
      geminiRequest<GeminiGenerateResponse>(
        `models/${env.GEMINI_CHAT_MODEL}:generateContent`,
        {
          systemInstruction: { parts: [{ text: instructions }] },
          contents: [{ role: "user", parts: [{ text: input }] }],
          generationConfig: {
            maxOutputTokens: env.GEMINI_MAX_OUTPUT_TOKENS,
          },
        },
      ),
    "Gemini chat request",
  );

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const reason = candidate?.finishReason
      ? ` (finish reason: ${candidate.finishReason})`
      : "";
    throw new ApiError(502, `Gemini returned an empty answer${reason}.`);
  }

  return {
    text,
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
