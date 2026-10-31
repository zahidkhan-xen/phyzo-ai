import { env } from "../config/env.js";

export function estimateChatCost(
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens / 1_000_000) * env.CHAT_INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * env.CHAT_OUTPUT_COST_PER_MILLION
  );
}

export function estimateEmbeddingCost(tokens: number): number {
  return (tokens / 1_000_000) * env.EMBEDDING_COST_PER_MILLION;
}

export function roundCost(cost: number): number {
  return Math.round(cost * 1_000_000) / 1_000_000;
}
