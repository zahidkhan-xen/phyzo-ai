import { describe, expect, it } from "vitest";
import {
  REFUSAL_MESSAGE,
  buildContext,
  buildInstructions,
  ensureCitations,
  isRefusalAnswer,
  sanitizeSourceMarkers,
  selectCitedChunks,
} from "../src/services/aiService.js";
import type { RetrievedChunk } from "../src/services/retrievalService.js";

function chunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: "chunk-1",
    textbookId: "book-1",
    textbookTitle: "Fundamentals of Physics",
    pageNumber: 12,
    chunkIndex: 0,
    text: "Newton's second law is F = ma, where F is the net force.",
    score: 0.82,
    ...overrides,
  };
}

describe("buildContext", () => {
  it("labels sources and respects the character budget", () => {
    const result = buildContext(
      [
        chunk(),
        chunk({
          chunkId: "chunk-2",
          pageNumber: 13,
          text: "Momentum is conserved in an isolated system.",
        }),
      ],
      220,
    );

    expect(result.usedChunks.length).toBe(1);
    expect(result.context).toContain('[Source 1] "Fundamentals of Physics" — page 12');
    expect(result.context.length).toBeLessThanOrEqual(230);
  });
});

describe("strict grounding helpers", () => {
  it("recognizes the refusal message", () => {
    expect(isRefusalAnswer(REFUSAL_MESSAGE)).toBe(true);
    expect(isRefusalAnswer("Newton's second law is F = ma [Source 1].")).toBe(
      false,
    );
  });

  it("appends a source list when the model omitted citations", () => {
    const answer = ensureCitations("Force equals mass times acceleration.", [
      chunk(),
    ]);

    expect(answer).toContain("Sources:");
    expect(answer).toContain("Fundamentals of Physics, p. 12");
  });

  it("keeps existing source markers untouched", () => {
    const answer = ensureCitations("Force equals mass times acceleration [Source 1].", [
      chunk(),
    ]);

    expect(answer).toBe("Force equals mass times acceleration [Source 1].");
  });

  it("does not add sources to refusals", () => {
    expect(ensureCitations(REFUSAL_MESSAGE, [chunk()])).toBe(REFUSAL_MESSAGE);
  });

  it("removes citations that point outside the supplied context", () => {
    expect(
      sanitizeSourceMarkers("Fact [Source 1], invented [Source 9].", 2),
    ).toBe("Fact [Source 1], invented .");
  });

  it("normalizes combined citation markers", () => {
    expect(
      sanitizeSourceMarkers("Fact [Source 1, Source 3, Source 9].", 3),
    ).toBe("Fact [Source 1] [Source 3].");
  });

  it("returns only the sources cited in the answer", () => {
    const first = chunk();
    const second = chunk({
      chunkId: "chunk-2",
      pageNumber: 13,
      text: "Momentum is conserved in an isolated system.",
    });

    expect(selectCitedChunks("Use F = ma [Source 2].", [first, second])).toEqual([
      second,
    ]);
    expect(selectCitedChunks("Use F = ma.", [first, second])).toEqual([
      first,
      second,
    ]);
  });

  it("parses combined citation markers", () => {
    const first = chunk();
    const second = chunk({
      chunkId: "chunk-2",
      pageNumber: 13,
      text: "Momentum is conserved in an isolated system.",
    });

    expect(
      selectCitedChunks("Use both [Source 1, Source 2].", [first, second]),
    ).toEqual([first, second]);
  });

  it("instructs the model to use only the textbook context", () => {
    const instructions = buildInstructions();
    expect(instructions).toContain("ONLY from the CONTEXT");
    expect(instructions).toContain(REFUSAL_MESSAGE);
    expect(instructions).toContain("[Source 1]");
  });
});
