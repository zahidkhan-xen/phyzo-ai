import rateLimit from "express-rate-limit";
import { isTest } from "../config/env.js";

const skip = () => isTest;

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip,
  message: { message: "Too many requests. Please try again shortly." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip,
  message: {
    message: "Too many authentication attempts. Please wait a few minutes.",
  },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip,
  message: { message: "You are sending messages too quickly." },
});
