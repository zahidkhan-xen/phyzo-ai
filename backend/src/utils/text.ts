import { createHash } from "node:crypto";

export interface PdfPageText {
  pageNumber: number;
  text: string;
}

export interface TextChunk {
  pageNumber: number;
  chunkIndex: number;
  text: string;
  tokenCount: number;
}

export interface ChunkOptions {
  maxChars?: number;
  overlapChars?: number;
  minChars?: number;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChars: 1800,
  overlapChars: 220,
  minChars: 40,
};

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findBoundary(text: string, target: number, windowStart: number): number {
  const lowerBound = Math.max(windowStart, target - 400);
  const slice = text.slice(lowerBound, target);
  const candidates = [
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  ];
  const boundary = Math.max(...candidates);
  if (boundary >= 0) return lowerBound + boundary + 1;

  const space = slice.lastIndexOf(" ");
  if (space >= 0) return lowerBound + space + 1;

  return target;
}

/**
 * Splits page-aware textbook text into overlapping chunks while preserving the
 * page number used for citations.
 */
export function chunkPages(
  pages: PdfPageText[],
  options: ChunkOptions = {},
): TextChunk[] {
  const { maxChars, overlapChars, minChars } = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const text = normalizeWhitespace(page.text);
    if (!text) continue;

    let start = 0;

    while (start < text.length) {
      const hardEnd = Math.min(start + maxChars, text.length);
      const end =
        hardEnd < text.length
          ? findBoundary(text, hardEnd, start + Math.floor(maxChars * 0.5))
          : hardEnd;

      const chunkText = text.slice(start, end).trim();
      if (chunkText.length >= minChars) {
        chunks.push({
          pageNumber: page.pageNumber,
          chunkIndex,
          text: chunkText,
          tokenCount: estimateTokens(chunkText),
        });
        chunkIndex += 1;
      }

      if (end >= text.length) break;

      let nextStart = Math.max(start + 1, end - overlapChars);
      const followingSpace = text.indexOf(" ", nextStart);
      if (followingSpace >= 0 && followingSpace < nextStart + 40) {
        nextStart = followingSpace + 1;
      }
      start = nextStart;
    }
  }

  return chunks;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}...`;
}

export function normalizeQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, " ").trim();
}
