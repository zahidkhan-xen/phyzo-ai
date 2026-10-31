import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { isProduction } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Please check the submitted information and try again.",
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "The uploaded PDF is too large."
        : "The file upload could not be completed.";
    res.status(400).json({ message });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(404).json({ message: "Resource not found." });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  ) {
    res.status(409).json({ message: "That record already exists." });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "Invalid JSON payload." });
    return;
  }

  logger.error("Unhandled request error", error);
  res.status(500).json({
    message: isProduction
      ? "Something went wrong. Please try again."
      : error instanceof Error
        ? error.message
        : "Something went wrong.",
  });
}
