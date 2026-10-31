import Link from "next/link";
import { ArrowLeft, Atom, BookOpenCheck, ShieldCheck, Sigma } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden border-r border-edge/70 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 auth-grid opacity-70" aria-hidden />
        <div
          className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-brand/20 blur-[100px]"
          aria-hidden
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-soft">
            <ShieldCheck className="h-3.5 w-3.5" />
            Grounded learning
          </span>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink">
            Every answer has a{" "}
            <span className="text-gradient">page number.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Ask physics questions and get explanations that stay strictly inside
            your course textbook, with citations you can check.
          </p>

          <div className="mt-8 space-y-3">
            {[
              {
                icon: BookOpenCheck,
                text: "Retrieves the most relevant textbook passages",
              },
              {
                icon: Sigma,
                text: "Renders equations with KaTeX",
              },
              {
                icon: ShieldCheck,
                text: "Refuses to answer outside the source",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 text-sm text-muted"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-panel/70 text-brand-soft">
                  <item.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl border border-edge bg-panel/60 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-cyan-400 text-white">
            <Atom className="h-5 w-5" />
          </span>
          <p className="text-xs leading-relaxed text-muted">
            Built for physics students who need to trust the derivation, not just
            the answer.
          </p>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-soft">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-7 text-center text-sm text-muted">{footer}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
