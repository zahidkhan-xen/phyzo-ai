import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const { GridFSBucket, ObjectId } = mongoose.mongo;
const BUCKET_NAME = "textbookPdfs";

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw ApiError.serviceUnavailable("The database is not ready.");
  }
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export async function savePdfBuffer(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = getBucket().openUploadStream(filename, {
      metadata: { contentType: "application/pdf" },
    });

    upload.on("error", reject);
    upload.on("finish", () => resolve(String(upload.id)));
    upload.end(buffer);
  });
}

export async function readPdfBuffer(fileId: string): Promise<Buffer> {
  if (!ObjectId.isValid(fileId)) {
    throw new ApiError(500, "The stored PDF reference is invalid.");
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const download = getBucket().openDownloadStream(new ObjectId(fileId));

    download.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    download.on("error", () => {
      reject(new ApiError(500, "The stored PDF could not be read."));
    });
    download.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function deletePdf(fileId: string | undefined): Promise<void> {
  if (!fileId || !ObjectId.isValid(fileId)) return;

  try {
    await getBucket().delete(new ObjectId(fileId));
  } catch (error) {
    logger.warn("Could not delete stored PDF", error);
  }
}
