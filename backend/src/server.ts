import type { Server } from "node:http";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { aiProvider, env } from "./config/env.js";
import { Textbook } from "./models/Textbook.js";
import { logger } from "./utils/logger.js";

let server: Server | undefined;

async function recoverInterruptedIndexing(): Promise<void> {
  const result = await Textbook.updateMany(
    { status: "processing" },
    {
      $set: {
        status: "failed",
        progress: 0,
        error:
          "Indexing was interrupted by a server restart. Reindex the textbook to try again.",
      },
    },
  );

  if (result.modifiedCount > 0) {
    logger.warn(
      `Marked ${result.modifiedCount} interrupted textbook indexing job(s) as failed.`,
    );
  }
}

async function start(): Promise<void> {
  await connectDatabase();
  await recoverInterruptedIndexing();

  const providerConfigured =
    aiProvider === "gemini"
      ? Boolean(env.GEMINI_API_KEY?.trim())
      : Boolean(env.OPENAI_API_KEY?.trim());

  logger.info(
    `AI provider: ${aiProvider} (configured: ${providerConfigured ? "yes" : "no"})`,
  );

  server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
    logger.info(`Allowed frontend origin: ${env.FRONTEND_URL}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}; shutting down.`);

  if (server) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

start().catch((error) => {
  logger.error("Server failed to start", error);
  process.exit(1);
});
