"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useConversations } from "@/components/chat/ConversationProvider";
import { Logo } from "@/components/ui/Logo";
import { cn, formatRelativeDate, getInitials, truncate } from "@/lib/utils";
import type { Conversation } from "@/types";

function ConversationRow({
  conversation,
  active,
  onNavigate,
}: {
  conversation: Conversation;
  active: boolean;
  onNavigate: () => void;
}) {
  const { remove } = useConversations();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm("Delete this conversation? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await remove(conversation.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 transition",
        active
          ? "border-brand/25 bg-brand/12"
          : "hover:border-edge hover:bg-white/[0.04]",
      )}
    >
      <Link
        href={`/chat/${conversation.id}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2.5"
      >
        <MessageSquare
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-brand-soft" : "text-muted/70",
          )}
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-[13px] font-medium",
              active ? "text-ink" : "text-muted group-hover:text-ink",
            )}
          >
            {truncate(conversation.title, 38)}
          </span>
          <span className="mt-0.5 block text-[10px] text-muted/60">
            {formatRelativeDate(conversation.lastMessageAt)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label="Delete conversation"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted/50 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { conversations } = useConversations();

  const navItems = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Admin dashboard", icon: Shield }]
      : []),
  ];

  async function handleLogout() {
    await logout();
    onNavigate?.();
    router.replace("/login");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-edge/70 px-4">
        <Logo href="/chat" />
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="shrink-0 px-3 pt-3">
        <Link
          href="/chat"
          onClick={onNavigate}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-medium text-white transition hover:bg-brand-strong"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </Link>
      </div>

      <nav className="shrink-0 space-y-1 px-3 py-3">
        {navItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname.startsWith("/admin")
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                active
                  ? "bg-white/[0.06] text-ink"
                  : "text-muted hover:bg-white/[0.04] hover:text-ink",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col border-t border-edge/60 px-3 pt-3">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/60">
            Recent conversations
          </span>
          <BookOpen className="h-3.5 w-3.5 text-muted/40" />
        </div>

        <div className="chat-scroll min-h-0 flex-1 space-y-1 overflow-y-auto pb-3">
          {conversations === null ? (
            <div className="space-y-2 px-1 py-1">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-xl bg-white/[0.03]"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted/60">
              No conversations yet. Ask your first physics question.
            </p>
          ) : (
            conversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={pathname === `/chat/${conversation.id}`}
                onNavigate={() => onNavigate?.()}
              />
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-edge/70 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/80 to-cyan-500/70 text-[11px] font-semibold text-white">
            {user ? getInitials(user.name) : "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ink">{user?.name}</p>
            <p className="truncate text-[10px] text-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-edge/70 bg-panel/70 px-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-ink"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo href="/chat" compact />
        <Link
          href="/chat"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-strong"
          aria-label="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </header>

      <aside className="hidden h-full w-[284px] shrink-0 border-r border-edge/70 bg-panel/50 backdrop-blur-xl md:flex md:flex-col">
        <SidebarBody />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[84%] max-w-[320px] animate-fade-in border-r border-edge bg-panel shadow-2xl">
            <SidebarBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
