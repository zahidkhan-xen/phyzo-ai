import type { ZodType } from "zod";
import { ApiError } from "./ApiError.js";

export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ApiError.badRequest(
      "Please check the submitted information and try again.",
      result.error.flatten(),
    );
  }
  return result.data;
}
