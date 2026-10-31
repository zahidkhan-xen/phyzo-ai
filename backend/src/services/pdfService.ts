import { PDFParse } from "pdf-parse";
import { ApiError } from "../utils/ApiError.js";
import type { PdfPageText } from "../utils/text.js";

function normalizePdfText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfPages(buffer: Buffer): Promise<PdfPageText[]> {
  if (!buffer.subarray(0, 1024).toString("latin1").includes("%PDF-")) {
    throw ApiError.badRequest("The uploaded file is not a valid PDF.");
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.pages.map((page) => ({
      pageNumber: page.num,
      text: normalizePdfText(page.text),
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown PDF parsing error";
    throw new ApiError(422, `This PDF could not be parsed: ${message}`);
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
