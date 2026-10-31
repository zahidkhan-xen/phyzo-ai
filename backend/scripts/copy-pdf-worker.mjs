import { copyFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const workerSource = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
const workerTarget = fileURLToPath(
  new URL("../dist/pdf.worker.mjs", import.meta.url),
);

mkdirSync(dirname(workerTarget), { recursive: true });
copyFileSync(workerSource, workerTarget);

console.log(`Copied PDF worker to ${workerTarget}`);
