import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const booleanFromString = z
  .string()
  .optional()
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://127.0.0.1:27017/physics_ai_tutor"),
  JWT_SECRET: z.string().min(16).default("dev-only-insecure-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z
    .string()
    .default("http://localhost:3000")
    .refine(
      (value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
          .every((origin) => /^https?:\/\/[^\s]+$/.test(origin)),
      "FRONTEND_URL must contain one or more http(s) origins separated by commas",
    ),
  COOKIE_NAME: z.string().default("physics_token"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),

  ADMIN_EMAILS: z.string().default(""),

  AI_PROVIDER: z.enum(["openai", "gemini"]).optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  OPENAI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(900),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_CHAT_MODEL: z.string().default("gemini-3.5-flash-lite"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(768),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2048),

  RETRIEVAL_TOP_K: z.coerce.number().int().positive().default(6),
  RETRIEVAL_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.25),
  RETRIEVAL_MAX_CHUNKS: z.coerce.number().int().positive().default(50000),
  MAX_CONTEXT_CHARS: z.coerce.number().int().positive().default(14000),
  ANSWER_CACHE_TTL_DAYS: z.coerce.number().int().positive().default(7),

  CHAT_INPUT_COST_PER_MILLION: z.coerce.number().nonnegative().default(0.4),
  CHAT_OUTPUT_COST_PER_MILLION: z.coerce.number().nonnegative().default(1.6),
  EMBEDDING_COST_PER_MILLION: z.coerce.number().nonnegative().default(0.02),

  DAILY_MESSAGE_LIMIT: z.coerce.number().int().positive().default(100),
  MAX_PDF_MB: z.coerce.number().positive().default(30),

  ENABLE_ATLAS_VECTOR_SEARCH: booleanFromString,
  ATLAS_VECTOR_INDEX: z.string().default("vector_index"),
  SYNC_INDEXING: booleanFromString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

if (
  env.NODE_ENV === "production" &&
  env.JWT_SECRET === "dev-only-insecure-secret-change-me"
) {
  throw new Error("JWT_SECRET must be set to a strong value in production");
}

export const adminEmails = env.ADMIN_EMAILS.split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const frontendOrigins = env.FRONTEND_URL.split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export const aiProvider =
  env.AI_PROVIDER ?? (env.GEMINI_API_KEY?.trim() ? "gemini" : "openai");
export const chatModel =
  aiProvider === "gemini" ? env.GEMINI_CHAT_MODEL : env.OPENAI_CHAT_MODEL;
export const embeddingModel =
  aiProvider === "gemini"
    ? env.GEMINI_EMBEDDING_MODEL
    : env.OPENAI_EMBEDDING_MODEL;
export const embeddingDimensions =
  aiProvider === "gemini"
    ? env.GEMINI_EMBEDDING_DIMENSIONS
    : env.OPENAI_EMBEDDING_DIMENSIONS;

const localOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (frontendOrigins.includes(origin)) return true;
  return !isProduction && localOriginPattern.test(origin);
}
