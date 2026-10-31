"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { authApi } from "@/services/api";
import { formatRelativeDate } from "@/lib/utils";

function SettingsContent() {
  const { user, refresh, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    setProfileLoading(true);

    try {
      await authApi.updateProfile({ name, email });
      await refresh();
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Could not update profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Could not change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-edge/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Logo href="/chat" />
          <nav className="flex items-center gap-2">
            <Link
              href="/chat"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted transition hover:bg-white/5 hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to chat
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        <div className="max-w-2xl">
          <Badge tone="brand">Account</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-2 text-sm text-muted">
            Manage your profile, password, and tutoring limits.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-edge bg-panel/60 p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand-soft">
                  <UserRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Profile</h2>
                  <p className="text-xs text-muted">
                    This is how your tutor greets you.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                <Input
                  label="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  required
                />
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />

                {profileError ? (
                  <p className="text-xs text-rose-300">{profileError}</p>
                ) : null}
                {profileMessage ? (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {profileMessage}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" loading={profileLoading}>
                    Save changes
                  </Button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-edge bg-panel/60 p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Password</h2>
                  <p className="text-xs text-muted">
                    Use at least 8 characters.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                {passwordError ? (
                  <p className="text-xs text-rose-300">{passwordError}</p>
                ) : null}
                {passwordMessage ? (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {passwordMessage}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={passwordLoading}
                  >
                    Update password
                  </Button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-edge bg-panel/60 p-5">
              <h2 className="text-sm font-semibold text-ink">Account overview</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted">
                    <Mail className="h-4 w-4" />
                    Email
                  </span>
                  <span className="truncate text-right text-xs text-ink">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted">
                    <Shield className="h-4 w-4" />
                    Role
                  </span>
                  <Badge tone={user?.role === "admin" ? "brand" : "slate"}>
                    {user?.role === "admin" ? "Administrator" : "Student"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Daily questions</span>
                  <span className="text-xs text-ink">
                    {user?.dailyMessageLimit && user.dailyMessageLimit > 0
                      ? `${user.dailyMessageLimit} / day`
                      : "Server default"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Joined</span>
                  <span className="text-xs text-ink">
                    {user ? formatRelativeDate(user.createdAt) : "—"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-edge bg-panel/60 p-5">
              <h2 className="text-sm font-semibold text-ink">Session</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                You are signed in with a secure HTTP-only cookie. Signing out
                clears the session on this device.
              </p>
              <Button
                type="button"
                variant="danger"
                className="mt-4 w-full"
                onClick={() => void handleLogout()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function SettingsScreen() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
