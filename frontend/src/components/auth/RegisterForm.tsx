"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      router.replace("/chat");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Ada Lovelace"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        minLength={2}
      />

      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@university.edu"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={8}
      />

      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Create account
        {!loading ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>

      <div className="flex items-start gap-2 rounded-xl border border-edge bg-panel/50 px-3.5 py-3 text-xs leading-relaxed text-muted">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
        New accounts are students by default. Administrators are configured on
        the server with ADMIN_EMAILS.
      </div>
    </form>
  );
}
