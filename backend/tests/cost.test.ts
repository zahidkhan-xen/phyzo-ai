import { describe, expect, it } from "vitest";
import {
  estimateChatCost,
  estimateEmbeddingCost,
  roundCost,
} from "../src/utils/cost.js";

describe("cost estimation", () => {
  it("estimates chat cost from input and output tokens", () => {
    const cost = estimateChatCost(1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(2, 5);
  });

  it("estimates embedding cost", () => {
    expect(estimateEmbeddingCost(1_000_000)).toBeCloseTo(0.02, 5);
  });

  it("rounds to six decimal places", () => {
    expect(roundCost(0.123456789)).toBe(0.123457);
  });
});
