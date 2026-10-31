import { describe, expect, it } from "vitest";
import {
  chunkPages,
  cosineSimilarity,
  estimateTokens,
  hashText,
  normalizeWhitespace,
} from "../src/utils/text.js";

describe("chunkPages", () => {
  it("preserves page numbers and produces sequential chunk indexes", () => {
    const chunks = chunkPages(
      [
        {
          pageNumber: 3,
          text: "Newton's first law states that an object remains at rest or in uniform motion unless acted upon by a net external force.",
        },
        {
          pageNumber: 4,
          text: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.",
        },
      ],
      { maxChars: 200, minChars: 20, overlapChars: 0 },
    );

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].pageNumber).toBe(3);
    expect(chunks.some((chunk) => chunk.pageNumber === 4)).toBe(true);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(
      chunks.map((_, index) => index),
    );
    expect(chunks.every((chunk) => chunk.tokenCount > 0)).toBe(true);
  });

  it("splits long paragraphs without exceeding the configured size", () => {
    const longParagraph = Array.from(
      { length: 80 },
      (_, index) => `Statement ${index} about conservation of energy and momentum.`,
    ).join(" ");

    const chunks = chunkPages(
      [{ pageNumber: 1, text: longParagraph }],
      { maxChars: 300, minChars: 20, overlapChars: 40 },
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.text.length <= 300)).toBe(true);
    expect(chunks.every((chunk) => chunk.pageNumber === 1)).toBe(true);

    const combined = chunks.map((chunk) => chunk.text).join(" ");
    for (let index = 0; index < 80; index += 1) {
      expect(combined).toContain(`Statement ${index} `);
    }
  });

  it("ignores pages with no usable text", () => {
    const chunks = chunkPages(
      [
        { pageNumber: 1, text: "   \n\n " },
        { pageNumber: 2, text: "A short but valid physics note about waves." },
      ],
      { minChars: 10 },
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].pageNumber).toBe(2);
  });
});

describe("vector helpers", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("returns 0 for mismatched dimensions", () => {
    expect(cosineSimilarity([1, 2], [1])).toBe(0);
  });
});

describe("text helpers", () => {
  it("normalizes whitespace", () => {
    expect(normalizeWhitespace("a  b\r\n\r\n\r\nc")).toBe("a b\n\nc");
  });

  it("estimates tokens from characters", () => {
    expect(estimateTokens("12345678")).toBe(2);
  });

  it("creates stable hashes", () => {
    expect(hashText("physics")).toBe(hashText("physics"));
    expect(hashText("physics")).not.toBe(hashText("Physics"));
  });
});
