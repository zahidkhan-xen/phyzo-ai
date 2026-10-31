"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileText,
  RefreshCw,
  RotateCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/services/api";
import {
  cn,
  formatBytes,
  formatCost,
  formatNumber,
  formatRelativeDate,
} from "@/lib/utils";
import type { Textbook } from "@/types";

function statusBadge(status?: string) {
  if (status === "ready") return <Badge tone="green">Ready</Badge>;
  if (status === "processing") return <Badge tone="amber">Indexing</Badge>;
  if (status === "failed") return <Badge tone="rose">Failed</Badge>;
  return <Badge tone="slate">Unknown</Badge>;
}

export function AdminBookScreen() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [grade, setGrade] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await adminApi.textbooks();
      setTextbooks(response.textbooks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load textbooks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasProcessing = textbooks.some(
    (textbook) => textbook.status === "processing",
  );

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      void load();
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessing, load]);

  function chooseFile(selected: File | null) {
    setError(null);
    setMessage(null);

    if (!selected) return;

    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are supported.");
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " "));
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    if (!title.trim()) {
      setError("Please add a title for the textbook.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("subject", subject.trim());
    formData.append("grade", grade.trim());
    formData.append("description", description.trim());

    setUploading(true);

    try {
      const response = await adminApi.upload(formData);
      setMessage(response.message);
      setFile(null);
      setTitle("");
      setGrade("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The upload could not be completed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleReindex(textbook: Textbook) {
    setError(null);
    setMessage(null);
    setBusyId(textbook.id);

    try {
      await adminApi.reindex(textbook.id);
      setMessage(`Reindexing "${textbook.title}" has started.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start reindexing.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(textbook: Textbook) {
    if (
      !window.confirm(
        `Delete "${textbook.title}"? This removes its indexed passages and cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);
    setMessage(null);
    setBusyId(textbook.id);

    try {
      await adminApi.removeTextbook(textbook.id);
      setMessage(`"${textbook.title}" was deleted.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the textbook.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Badge tone="brand">Knowledge base</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          Textbook library
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Upload a physics textbook PDF. The server extracts page-aware text,
          generates embeddings, and stores them in MongoDB for strict retrieval.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-edge bg-panel/60 p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand-soft">
              <UploadCloud className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Upload a PDF</h2>
              <p className="text-xs text-muted">
                Text-based PDFs work best. Scanned books need OCR.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="mt-5 space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition",
                dragging
                  ? "border-brand/60 bg-brand/8"
                  : "border-edge bg-canvas-soft/40 hover:border-brand/35 hover:bg-brand/[0.04]",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand-soft">
                <FileText className="h-5 w-5" />
              </span>
              {file ? (
                <>
                  <p className="mt-3 max-w-full truncate text-sm font-medium text-ink">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatBytes(file.size)} · click to replace
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm font-medium text-ink">
                    Drop your textbook PDF here
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    or click to browse · max 30 MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) =>
                  chooseFile(event.target.files?.[0] ?? null)
                }
              />
            </div>

            <Input
              label="Title"
              placeholder="Fundamentals of Physics"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
              <Input
                label="Grade / level"
                placeholder="Grade 12, University..."
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-ink"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional notes about this textbook..."
                className="w-full resize-none rounded-xl border border-edge bg-canvas-soft/80 px-3.5 py-3 text-sm text-ink placeholder:text-muted/55 transition focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={uploading}
            >
              {!uploading ? <UploadCloud className="h-4 w-4" /> : null}
              Upload and index
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-edge bg-panel/60">
          <div className="flex items-center justify-between border-b border-edge/70 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Indexed textbooks
              </h2>
              <p className="text-xs text-muted">
                {hasProcessing
                  ? "Indexing in progress — updating automatically."
                  : "All indexing jobs are finished."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Refresh textbooks"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner label="Loading library" />
            </div>
          ) : textbooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <BookOpen className="h-8 w-8 text-muted/40" />
              <p className="mt-3 text-sm font-medium text-ink">
                Your library is empty
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
                Upload the course textbook to start indexing it for students.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-edge/50">
              {textbooks.map((textbook) => (
                <div key={textbook.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-soft">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-ink">
                            {textbook.title}
                          </p>
                          {statusBadge(textbook.status)}
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {textbook.subject}
                          {textbook.grade ? ` · ${textbook.grade}` : ""} ·{" "}
                          {textbook.pageCount} pages · {textbook.chunkCount}{" "}
                          passages
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted/60">
                          Uploaded {formatRelativeDate(textbook.createdAt)}
                          {textbook.embeddingTokens
                            ? ` · ${formatNumber(textbook.embeddingTokens)} embedding tokens (${formatCost(textbook.embeddingCostUsd ?? 0)})`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleReindex(textbook)}
                        disabled={
                          busyId === textbook.id ||
                          textbook.status === "processing"
                        }
                        title="Reindex textbook"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-white/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCw
                          className={cn(
                            "h-3.5 w-3.5",
                            busyId === textbook.id && "animate-spin",
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(textbook)}
                        disabled={busyId === textbook.id}
                        title="Delete textbook"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {textbook.status === "processing" ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted">
                        <span>Embedding and indexing</span>
                        <span>{textbook.progress ?? 0}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand to-cyan-400 transition-all duration-500"
                          style={{ width: `${textbook.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {textbook.status === "failed" && textbook.error ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-rose-200">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {textbook.error}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
