import type { Types } from "mongoose";
import {
  aiProvider,
  embeddingDimensions,
  embeddingModel,
  env,
} from "../config/env.js";
import { Chunk } from "../models/Chunk.js";
import { Textbook } from "../models/Textbook.js";
import { Usage } from "../models/Usage.js";
import { ApiError } from "../utils/ApiError.js";
import { estimateEmbeddingCost, roundCost } from "../utils/cost.js";
import { logger } from "../utils/logger.js";
import { chunkPages, hashText } from "../utils/text.js";
import { embedTexts } from "./embeddingService.js";
import { readPdfBuffer } from "./fileStorage.js";
import { extractPdfPages } from "./pdfService.js";

interface ReusableEmbedding {
  contentHash: string;
  embedding: number[];
}

interface ReuseResult {
  embeddings: Map<string, number[]>;
  maxChunkIndex: number;
}

async function reusableEmbeddings(
  contentHashes: string[],
  textbookId: Types.ObjectId,
): Promise<ReuseResult> {
  const embeddings = new Map<string, number[]>();

  const existing = (await Chunk.find({
    contentHash: { $in: contentHashes },
  })
    .select("+embedding contentHash")
    .lean()) as unknown as ReusableEmbedding[];

  for (const chunk of existing) {
    if (
      chunk.embedding?.length === embeddingDimensions &&
      !embeddings.has(chunk.contentHash)
    ) {
      embeddings.set(chunk.contentHash, chunk.embedding);
    }
  }

  const lastChunk = await Chunk.findOne({ textbookId })
    .sort({ chunkIndex: -1 })
    .select("chunkIndex")
    .lean();

  return { embeddings, maxChunkIndex: lastChunk?.chunkIndex ?? -1 };
}

async function setProgress(textbookId: string, progress: number): Promise<void> {
  await Textbook.updateOne({ _id: textbookId }, { $set: { progress } });
}

export async function indexTextbook(textbookId: string): Promise<void> {
  const textbook = await Textbook.findById(textbookId).select("+storedFileId");
  if (!textbook) {
    logger.error(`Textbook ${textbookId} not found for indexing`);
    return;
  }

  let offset: number | null = null;

  try {
    await Textbook.updateOne(
      { _id: textbook._id },
      {
        $set: {
          status: "processing",
          progress: 5,
          error: undefined,
        },
      },
    );

    await setProgress(textbookId, 10);

    const buffer = await readPdfBuffer(textbook.storedFileId);
    const pages = await extractPdfPages(buffer);
    const nonEmptyPages = pages.filter((page) => page.text.trim().length > 0);

    if (nonEmptyPages.length === 0) {
      throw new ApiError(
        422,
        "No extractable text was found. Scanned PDFs need OCR before upload.",
      );
    }

    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      throw new ApiError(422, "The PDF did not contain enough text to index.");
    }

    await setProgress(textbookId, 20);

    const contentHashes = [...new Set(chunks.map((chunk) => hashText(chunk.text)))];
    const reuse = await reusableEmbeddings(contentHashes, textbook._id);
    const reusable = reuse.embeddings;
    offset = reuse.maxChunkIndex + 1;

    const missingHashes = contentHashes.filter((hash) => !reusable.has(hash));
    const hashToText = new Map<string, string>();
    for (const chunk of chunks) {
      const hash = hashText(chunk.text);
      if (!reusable.has(hash) && !hashToText.has(hash)) {
        hashToText.set(hash, chunk.text);
      }
    }

    const missingTexts = missingHashes.map((hash) => hashToText.get(hash) ?? "");
    let embeddingTokens = 0;

    if (missingTexts.length > 0) {
      const batchSize = 64;
      for (let start = 0; start < missingTexts.length; start += batchSize) {
        const batchHashes = missingHashes.slice(start, start + batchSize);
        const batch = missingTexts.slice(start, start + batchSize);
        const { embeddings, tokens } = await embedTexts(batch);
        embeddingTokens += tokens;

        embeddings.forEach((embedding, index) => {
          reusable.set(batchHashes[index], embedding);
        });

        const completed = Math.min(start + batch.length, missingTexts.length);
        const progress = 25 + Math.round((completed / missingTexts.length) * 60);
        await setProgress(textbookId, progress);
      }
    }

    const embeddingCostUsd =
      aiProvider === "gemini"
        ? 0
        : roundCost(estimateEmbeddingCost(embeddingTokens));

    const documents = chunks.map((chunk) => {
      const hash = hashText(chunk.text);
      return {
        textbookId: textbook._id,
        pageNumber: chunk.pageNumber,
        chunkIndex: (offset ?? 0) + chunk.chunkIndex,
        text: chunk.text,
        contentHash: hash,
        tokenCount: chunk.tokenCount,
        embedding: reusable.get(hash) ?? [],
      };
    });

    if (documents.some((document) => document.embedding.length === 0)) {
      throw new ApiError(502, "Some textbook chunks could not be embedded.");
    }

    await Chunk.insertMany(documents, { ordered: false });

    if ((offset ?? 0) > 0) {
      await Chunk.deleteMany({
        textbookId: textbook._id,
        chunkIndex: { $lt: offset as number },
      });
    }

    await Textbook.updateOne(
      { _id: textbook._id },
      {
        $set: {
          status: "ready",
          progress: 100,
          error: undefined,
          pageCount: pages.length,
          chunkCount: documents.length,
          embeddingTokens,
          embeddingCostUsd,
        },
      },
    );

    if (embeddingTokens > 0 || documents.length > 0) {
      await Usage.create({
        userId: textbook.uploadedBy,
        kind: "embedding",
        model: embeddingModel,
        inputTokens: embeddingTokens,
        outputTokens: 0,
        estimatedCostUsd: embeddingCostUsd,
      });
    }

    logger.info(
      `Indexed textbook "${textbook.title}" (${documents.length} chunks, ${embeddingTokens} embedding tokens)`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown indexing error";
    logger.error(`Textbook indexing failed for ${textbookId}`, error);

    if (offset !== null) {
      await Chunk.deleteMany({
        textbookId: textbook._id,
        chunkIndex: { $gte: offset },
      }).catch(() => undefined);
    }

    const retainedIndex = Boolean(
      await Chunk.exists({ textbookId: textbook._id }),
    );

    if (retainedIndex) {
      await Textbook.updateOne(
        { _id: textbook._id },
        {
          $set: {
            status: "ready",
            progress: 100,
            chunkCount: await Chunk.countDocuments({ textbookId: textbook._id }),
            error: `Reindex failed; previous index retained. ${message}`.slice(
              0,
              500,
            ),
          },
        },
      ).catch(() => undefined);
    } else {
      await Textbook.updateOne(
        { _id: textbook._id },
        {
          $set: {
            status: "failed",
            progress: 0,
            error: message.slice(0, 500),
          },
        },
      ).catch(() => undefined);
    }
  }
}
