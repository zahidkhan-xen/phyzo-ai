"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, BookPlus, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/book", label: "Upload textbook", icon: BookPlus },
  ];

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-edge/70 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-8">
        <Logo href="/chat" />

        <nav className="ml-2 flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition sm:text-sm",
                  active
                    ? "bg-brand/12 text-brand-soft"
                    : "text-muted hover:bg-white/5 hover:text-ink",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/chat"
            className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted transition hover:bg-white/5 hover:text-ink sm:inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Student chat
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-1 text-[10px] font-medium text-brand-soft md:inline-flex">
            <Shield className="h-3 w-3" />
            {user?.name ?? "Admin"}
          </span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-dvh">
        <AdminNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
