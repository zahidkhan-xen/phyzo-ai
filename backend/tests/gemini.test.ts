import { describe, expect, it } from "vitest";
import { GeminiApiError, describeGeminiError } from "../src/config/gemini.js";

describe("Gemini error messages", () => {
  it("explains invalid API keys", () => {
    expect(describeGeminiError(new GeminiApiError(401, "bad key"))).toContain(
      "GEMINI_API_KEY",
    );
  });

  it("explains free-tier rate limits", () => {
    expect(describeGeminiError(new GeminiApiError(429, "quota"))).toContain(
      "rate limit",
    );
  });

  it("passes through bad-request details", () => {
    expect(describeGeminiError(new GeminiApiError(400, "bad body"))).toContain(
      "bad body",
    );
  });
});
