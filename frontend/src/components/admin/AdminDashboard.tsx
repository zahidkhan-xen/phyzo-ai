"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookPlus,
  ChevronRight,
  Database,
  FileText,
  Gauge,
  MessagesSquare,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/services/api";
import {
  cn,
  formatCost,
  formatNumber,
  formatRelativeDate,
  truncate,
} from "@/lib/utils";
import type { AdminStats, Textbook, User } from "@/types";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone?: "brand" | "cyan" | "green" | "amber";
}) {
  const toneClasses = {
    brand: "bg-brand/10 text-brand-soft border-brand/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };

  return (
    <div className="rounded-2xl border border-edge bg-panel/60 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted/70">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border",
            toneClasses[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[11px] text-muted">{hint}</p>
    </div>
  );
}

function statusBadge(status?: string) {
  if (status === "ready") return <Badge tone="green">Ready</Badge>;
  if (status === "processing") return <Badge tone="amber">Indexing</Badge>;
  if (status === "failed") return <Badge tone="rose">Failed</Badge>;
  return <Badge tone="slate">Unknown</Badge>;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    setError(null);

    try {
      const [statsResponse, textbooksResponse, usersResponse] =
        await Promise.all([
          adminApi.stats(),
          adminApi.textbooks(),
          adminApi.users(),
        ]);
      setStats(statsResponse);
      setTextbooks(textbooksResponse.textbooks);
      setUsers(usersResponse.users);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load admin data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading admin dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone="brand">Administration</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Tutor overview
          </h1>
          <p className="mt-2 text-sm text-muted">
            Monitor textbook indexing, usage, and the students using the tutor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void load(true)}
            loading={refreshing}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link
            href="/admin/book"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
          >
            <BookPlus className="h-4 w-4" />
            Upload textbook
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Users"
              value={formatNumber(stats.users)}
              hint={`${stats.admins} administrator${stats.admins === 1 ? "" : "s"}`}
              icon={Users}
            />
            <StatCard
              label="Conversations"
              value={formatNumber(stats.conversations)}
              hint={`${formatNumber(stats.messages)} messages exchanged`}
              icon={MessagesSquare}
              tone="cyan"
            />
            <StatCard
              label="Indexed passages"
              value={formatNumber(stats.chunks)}
              hint={`${stats.textbooks.ready} ready textbook${stats.textbooks.ready === 1 ? "" : "s"}`}
              icon={Database}
              tone="green"
            />
            <StatCard
              label="AI spend today"
              value={formatCost(stats.usageToday.estimatedCostUsd)}
              hint={`${stats.usageToday.requests} live answers · ${stats.usageToday.cachedRequests} cache hits`}
              icon={Gauge}
              tone="amber"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-edge bg-panel/60 p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Cost optimization
                  </h2>
                  <p className="text-xs text-muted">
                    All-time usage across chat and indexing.
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-brand-soft" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Live answers",
                    value: formatNumber(stats.usageAllTime.requests),
                  },
                  {
                    label: "Cache hits",
                    value: formatNumber(stats.usageAllTime.cachedRequests),
                  },
                  {
                    label: "Total tokens",
                    value: formatNumber(
                      stats.usageAllTime.inputTokens +
                        stats.usageAllTime.outputTokens,
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-edge/70 bg-canvas-soft/60 px-3.5 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted/60">
                      {item.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-3.5 py-2.5">
                <span className="text-xs text-emerald-200/80">
                  Estimated all-time AI cost
                </span>
                <span className="text-sm font-semibold text-emerald-300">
                  {formatCost(stats.usageAllTime.estimatedCostUsd)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-edge bg-panel/60 p-5">
              <h2 className="text-sm font-semibold text-ink">
                Textbook pipeline
              </h2>
              <div className="mt-4 space-y-3">
                {[
                  {
                    label: "Ready",
                    value: stats.textbooks.ready,
                    tone: "bg-emerald-400",
                  },
                  {
                    label: "Processing",
                    value: stats.textbooks.processing,
                    tone: "bg-amber-400",
                  },
                  {
                    label: "Failed",
                    value: stats.textbooks.failed,
                    tone: "bg-rose-400",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">{item.label}</span>
                      <span className="font-medium text-ink">{item.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn("h-full rounded-full", item.tone)}
                        style={{
                          width: `${
                            stats.textbooks.total === 0
                              ? 0
                              : Math.round(
                                  (item.value / stats.textbooks.total) * 100,
                                )
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
                {stats.textbooks.total} textbook
                {stats.textbooks.total === 1 ? "" : "s"} uploaded in total.
              </p>
            </div>
          </div>
        </>
      ) : null}

      <section className="rounded-2xl border border-edge bg-panel/60">
        <div className="flex items-center justify-between border-b border-edge/70 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Textbooks</h2>
            <p className="text-xs text-muted">
              Uploaded course material and indexing status.
            </p>
          </div>
          <Link
            href="/admin/book"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-soft transition hover:text-white"
          >
            Manage
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {textbooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <BookOpen className="h-8 w-8 text-muted/40" />
            <p className="mt-3 text-sm font-medium text-ink">
              No textbooks indexed
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
              Upload a PDF to enable textbook-grounded tutoring for students.
            </p>
            <Link
              href="/admin/book"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-xs font-medium text-white transition hover:bg-brand-strong"
            >
              <BookPlus className="h-3.5 w-3.5" />
              Upload your first textbook
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-edge/60 text-[10px] uppercase tracking-[0.14em] text-muted/60">
                  <th className="px-5 py-3 font-medium">Textbook</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Pages</th>
                  <th className="px-4 py-3 font-medium">Passages</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 text-right font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {textbooks.map((textbook) => (
                  <tr
                    key={textbook.id}
                    className="border-b border-edge/40 text-sm last:border-0"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-soft">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[280px] truncate text-xs font-medium text-ink">
                            {textbook.title}
                          </p>
                          <p className="text-[10px] text-muted">
                            {textbook.subject}
                            {textbook.grade ? ` · ${textbook.grade}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {statusBadge(textbook.status)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {textbook.pageCount}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {textbook.chunkCount}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {formatRelativeDate(textbook.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted">
                      {textbook.status === "processing"
                        ? `${textbook.progress ?? 0}%`
                        : textbook.status === "ready"
                          ? "Complete"
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-edge bg-panel/60">
        <div className="border-b border-edge/70 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Students & staff</h2>
          <p className="text-xs text-muted">
            Most recently created accounts first.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-edge/60 text-[10px] uppercase tracking-[0.14em] text-muted/60">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Daily limit</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-edge/40 text-sm last:border-0"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-medium text-ink">{user.name}</p>
                    <p className="text-[10px] text-muted">
                      {truncate(user.email, 42)}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={user.role === "admin" ? "brand" : "slate"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted">
                    {user.dailyMessageLimit > 0
                      ? `${user.dailyMessageLimit} / day`
                      : "Default"}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">
                    {formatRelativeDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
