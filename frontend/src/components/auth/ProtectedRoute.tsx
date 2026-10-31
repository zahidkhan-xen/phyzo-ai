"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FullPageLoader } from "@/components/ui/Spinner";

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/chat")}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return <FullPageLoader label="Checking your session" />;
  }

  if (!user) {
    return <FullPageLoader label="Redirecting to sign in" />;
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-edge bg-panel/80 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink">
            Administrator access only
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your account does not have permission to open the admin dashboard.
          </p>
          <Link
            href="/chat"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-strong"
          >
            Back to the tutor
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
