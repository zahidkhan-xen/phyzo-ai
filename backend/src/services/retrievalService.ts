import type { Types } from "mongoose";
import { env } from "../config/env.js";
import { Chunk } from "../models/Chunk.js";
import { Textbook } from "../models/Textbook.js";
import { ApiError } from "../utils/ApiError.js";
import { cosineSimilarity, truncate } from "../utils/text.js";
import { logger } from "../utils/logger.js";
import { embedQuery } from "./embeddingService.js";

export interface RetrievedChunk {
  chunkId: string;
  textbookId: string;
  textbookTitle: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  score: number;
}

export interface RetrievalOptions {
  query: string;
  textbookIds: Types.ObjectId[];
  topK?: number;
  minScore?: number;
}

interface RankableChunk {
  _id: Types.ObjectId;
  textbookId: Types.ObjectId;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding?: number[];
}

export function rankChunks(
  chunks: RankableChunk[],
  queryEmbedding: number[],
  topK: number,
  minScore: number,
): Array<RankableChunk & { score: number }> {
  return chunks
    .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
    }))
    .filter((chunk) => chunk.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

async function atlasVectorSearch(
  queryEmbedding: number[],
  textbookIds: Types.ObjectId[],
  topK: number,
): Promise<Array<RankableChunk & { score: number }>> {
  const rows = await Chunk.aggregate<RankableChunk & { score: number }>([
    {
      $vectorSearch: {
        index: env.ATLAS_VECTOR_INDEX,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(100, topK * 25),
        limit: topK,
        filter: { textbookId: { $in: textbookIds } },
      },
    },
    {
      $project: {
        textbookId: 1,
        pageNumber: 1,
        chunkIndex: 1,
        text: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return rows;
}

async function inMemoryVectorSearch(
  queryEmbedding: number[],
  textbookIds: Types.ObjectId[],
  topK: number,
  minScore: number,
): Promise<Array<RankableChunk & { score: number }>> {
  const chunks = (await Chunk.find({ textbookId: { $in: textbookIds } })
    .select("+embedding")
    .limit(env.RETRIEVAL_MAX_CHUNKS)
    .lean()) as unknown as RankableChunk[];

  return rankChunks(chunks, queryEmbedding, topK, minScore);
}

export async function retrieveContext({
  query,
  textbookIds,
  topK = env.RETRIEVAL_TOP_K,
  minScore = env.RETRIEVAL_MIN_SCORE,
}: RetrievalOptions): Promise<RetrievedChunk[]> {
  if (!query.trim() || textbookIds.length === 0) {
    return [];
  }

  let queryEmbedding: number[];

  try {
    queryEmbedding = await embedQuery(query);
  } catch (error) {
    logger.error("Query embedding failed", error);
    throw ApiError.serviceUnavailable(
      error instanceof ApiError
        ? error.message
        : "The tutor could not search the textbook right now. Please try again.",
    );
  }

  if (queryEmbedding.length === 0) {
    return [];
  }

  let matches: Array<RankableChunk & { score: number }> = [];

  if (env.ENABLE_ATLAS_VECTOR_SEARCH) {
    try {
      const atlasMatches = await atlasVectorSearch(queryEmbedding, textbookIds, topK);
      matches = atlasMatches.filter((match) => match.score >= minScore);
    } catch (error) {
      logger.warn(
        "Atlas vector search failed; falling back to in-process similarity.",
        error,
      );
      matches = await inMemoryVectorSearch(
        queryEmbedding,
        textbookIds,
        topK,
        minScore,
      );
    }
  } else {
    matches = await inMemoryVectorSearch(
      queryEmbedding,
      textbookIds,
      topK,
      minScore,
    );
  }

  if (matches.length === 0) {
    return [];
  }

  const textbooks = await Textbook.find({
    _id: { $in: textbookIds },
  })
    .select("title")
    .lean();

  const titleMap = new Map(
    textbooks.map((textbook) => [String(textbook._id), textbook.title]),
  );

  return matches.map((match) => ({
    chunkId: String(match._id),
    textbookId: String(match.textbookId),
    textbookTitle: titleMap.get(String(match.textbookId)) ?? "Textbook",
    pageNumber: match.pageNumber,
    chunkIndex: match.chunkIndex,
    text: match.text,
    score: match.score,
  }));
}

export function buildCitationExcerpt(text: string): string {
  return truncate(text, 380);
}
