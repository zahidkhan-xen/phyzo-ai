import Link from "next/link";
import {
  ArrowRight,
  Atom,
  BookOpenCheck,
  Check,
  FileText,
  Gauge,
  GraduationCap,
  MessagesSquare,
  Quote,
  ShieldCheck,
  Sigma,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";

const features = [
  {
    icon: ShieldCheck,
    title: "Strictly textbook-grounded",
    body: "Answers come only from the indexed textbook. When the source does not cover it, the tutor refuses instead of guessing.",
  },
  {
    icon: BookOpenCheck,
    title: "Page-level citations",
    body: "Every explanation links back to the exact textbook page and passage, so students can verify what they learn.",
  },
  {
    icon: Sigma,
    title: "Built for physics math",
    body: "Markdown and KaTeX render equations, derivations, units, and worked examples with full clarity.",
  },
  {
    icon: MessagesSquare,
    title: "Conversation memory",
    body: "Follow-up questions keep their context across a thread, making multi-step problem solving natural.",
  },
  {
    icon: FileText,
    title: "Admin PDF indexing",
    body: "Upload a textbook PDF, watch page-aware chunking and embedding progress, then reindex at any time.",
  },
  {
    icon: Gauge,
    title: "Cost-aware retrieval",
    body: "Relevance thresholds, answer caching, token budgets, and per-student limits keep AI spend under control.",
  },
];

const steps = [
  {
    number: "01",
    title: "Index your textbook",
    body: "An administrator uploads the course PDF. The backend extracts page text, chunks it, and stores embeddings in MongoDB.",
  },
  {
    number: "02",
    title: "Ask a physics question",
    body: "The tutor embeds the question, retrieves the most relevant passages, and sends only that context to OpenAI.",
  },
  {
    number: "03",
    title: "Study with citations",
    body: "Read a clear explanation with inline math and source cards showing the textbook title, page, and passage.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white shadow-[0_10px_30px_-12px_rgba(99,102,241,0.9)] transition hover:bg-brand-strong"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid w-full max-w-7xl gap-14 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pt-20">
          <div className="relative z-10 animate-fade-up">
            <Badge tone="brand" className="mb-6 px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Retrieval-augmented physics tutoring
            </Badge>

            <h1 className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              Physics, answered from{" "}
              <span className="text-gradient">your own textbook.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              An AI study companion that refuses to guess. Ask questions, get
              equation-ready explanations, and verify every claim against the
              exact page in your course material.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-medium text-white shadow-[0_16px_40px_-18px_rgba(99,102,241,1)] transition hover:bg-brand-strong"
              >
                Start studying free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-edge bg-white/[0.03] px-6 text-[15px] font-medium text-ink transition hover:border-brand/40 hover:bg-white/[0.06]"
              >
                <GraduationCap className="h-4 w-4 text-brand-soft" />
                Continue learning
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted">
              {[
                "Textbook-only answers",
                "Page citations",
                "LaTeX equations",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:140ms]">
            <div
              className="absolute -inset-8 rounded-[2rem] bg-brand/10 blur-3xl"
              aria-hidden
            />
            <div className="surface glow-ring relative overflow-hidden rounded-3xl p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-edge pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand-soft">
                    <Atom className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      Newtonian mechanics
                    </p>
                    <p className="text-[11px] text-muted">
                      Fundamentals of Physics · Ch. 5
                    </p>
                  </div>
                </div>
                <Badge tone="green">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Grounded
                </Badge>
              </div>

              <div className="space-y-4 pt-5">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm leading-relaxed text-white">
                    Why does a heavier object not fall faster in a vacuum?
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-cyan-400 text-white">
                    <Atom className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-edge bg-panel-soft/70 px-4 py-3.5">
                    <p className="text-sm leading-relaxed text-[#dbe4f1]">
                      In a vacuum, gravitational acceleration is independent of
                      mass. Newton&apos;s second law and gravitation give:
                    </p>
                    <div className="my-3 rounded-xl border border-brand/15 bg-brand/[0.06] px-4 py-3 text-center font-mono text-[13px] text-brand-soft">
                      a = F / m = (G M m / r²) / m = G M / r²
                    </div>
                    <p className="text-sm leading-relaxed text-[#dbe4f1]">
                      The mass cancels out, so both objects accelerate at the
                      same rate{" "}
                      <span className="font-medium text-brand-soft">
                        [Source 1]
                      </span>
                      .
                    </p>

                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-edge bg-canvas/50 px-3 py-2">
                      <BookOpenCheck className="h-4 w-4 shrink-0 text-cyan-300" />
                      <p className="truncate text-[11px] text-muted">
                        <span className="text-ink">
                          Fundamentals of Physics
                        </span>{" "}
                        · page 118
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-edge bg-canvas-soft/80 px-3.5 py-2.5 text-xs text-muted">
                  <Sparkles className="h-3.5 w-3.5 text-brand-soft" />
                  Ask a follow-up about this derivation...
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-edge bg-panel/95 px-4 py-3 shadow-2xl backdrop-blur sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium text-ink">
                    No outside knowledge
                  </p>
                  <p className="text-[10px] text-muted">
                    Strictly retrieval-grounded
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-edge/60 bg-canvas-soft/40 py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 text-xs font-medium uppercase tracking-[0.18em] text-muted/70 sm:px-8">
            <span>MongoDB vector retrieval</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted/40 sm:block" />
            <span>OpenAI Responses API</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted/40 sm:block" />
            <span>Page-aware citations</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted/40 sm:block" />
            <span>Next.js App Router</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <Badge tone="cyan">Why students trust it</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              A tutor that stays inside the syllabus
            </h2>
            <p className="mt-4 text-muted">
              General-purpose chatbots improvise. Physics AI Tutor retrieves
              from your course textbook, cites the page, and stops when the
              answer is not there.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-edge bg-panel/55 p-6 transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-panel/80"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand-soft transition group-hover:bg-brand/15">
                  <feature.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative border-y border-edge/60 bg-canvas-soft/50 py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <Badge tone="brand">How it works</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                  From PDF to verified answer
                </h2>
                <p className="mt-4 max-w-md text-muted">
                  A custom RAG pipeline keeps the AI anchored. Textbook content
                  is chunked per page, embedded with{" "}
                  <span className="font-mono text-xs text-brand-soft">
                    text-embedding-3-small
                  </span>
                  , and retrieved by cosine similarity.
                </p>
                <div className="mt-8 rounded-2xl border border-edge bg-panel/60 p-5">
                  <div className="flex items-start gap-3">
                    <Quote className="h-5 w-5 shrink-0 text-brand-soft" />
                    <p className="text-sm leading-relaxed text-muted">
                      &ldquo;If the answer isn&apos;t in the textbook, the tutor
                      says so. That&apos;s exactly what I want my students to
                      see.&rdquo;
                    </p>
                  </div>
                  <p className="mt-3 pl-8 text-xs text-muted/70">
                    — The design goal
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className="flex gap-5 rounded-2xl border border-edge bg-panel/70 p-5 transition hover:border-brand/25 sm:p-6"
                  >
                    <span className="font-mono text-sm font-semibold text-brand-soft">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        {step.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/15 via-panel to-cyan-500/10 px-6 py-14 text-center sm:px-12">
            <div
              className="absolute inset-0 auth-grid opacity-60"
              aria-hidden
            />
            <div className="relative">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_16px_40px_-16px_rgba(99,102,241,1)]">
                <Atom className="h-6 w-6" />
              </span>
              <h2 className="mx-auto mt-6 max-w-xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Study smarter, with the textbook open
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted">
                Create a student account and ask your first question. Every
                answer is anchored to the course material.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-7 text-[15px] font-medium text-white transition hover:bg-brand-strong"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-edge bg-white/[0.04] px-7 text-[15px] font-medium text-ink transition hover:bg-white/[0.07]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-edge/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Logo />
          <p className="text-xs text-muted">
            Textbook-grounded physics tutoring · Built with Next.js, Express,
            MongoDB & OpenAI
          </p>
        </div>
      </footer>
    </div>
  );
}
