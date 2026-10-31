import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

export interface AuthTokenPayload {
  sub: string;
  role: "student" | "admin";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || !decoded.sub) {
      throw new Error("Invalid token payload");
    }
    return {
      sub: String(decoded.sub),
      role: decoded.role === "admin" ? "admin" : "student",
    };
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please sign in again.");
  }
}
