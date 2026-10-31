import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export class GeminiApiError extends Error {
  readonly status: number;
  readonly statusText?: string;

  constructor(status: number, message: string, statusText?: string) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim());
}

export function describeGeminiError(error: unknown): string {
  if (error instanceof GeminiApiError) {
    if (error.status === 400) {
      return `Gemini rejected the request: ${error.message}`;
    }
    if (error.status === 401 || error.status === 403) {
      return "Gemini rejected the API key. Check GEMINI_API_KEY and restart the backend.";
    }
    if (error.status === 429) {
      return "Gemini free-tier rate limit reached. Wait a minute and try again.";
    }
    if (error.status >= 500) {
      return "Gemini is temporarily unavailable. Try again shortly.";
    }
    return `Gemini request failed (${error.status}): ${error.message}`;
  }
  return error instanceof Error ? error.message : "Unknown Gemini error";
}

export async function geminiRequest<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw ApiError.serviceUnavailable(
      "Gemini is not configured yet. Add GEMINI_API_KEY to backend/.env and restart the backend.",
    );
  }

  const response = await fetch(`${GEMINI_BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const error = (data as GeminiErrorBody | null)?.error;
    throw new GeminiApiError(
      response.status,
      error?.message || `Gemini request failed with status ${response.status}`,
      error?.status,
    );
  }

  return data as T;
}
