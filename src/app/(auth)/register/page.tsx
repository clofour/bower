"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/auth-actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <div
        className="auth-stagger space-y-1.5"
        style={{ "--stagger": "1" } as React.CSSProperties}
      >
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          An invite token is required to join.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="auth-stagger mt-8 space-y-4"
        style={{ "--stagger": "2" } as React.CSSProperties}
      >
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="inviteToken">Invite token</Label>
          <Input
            id="inviteToken"
            name="inviteToken"
            type="text"
            autoComplete="off"
            required
            placeholder="ci_..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </form>

      <p
        className="auth-stagger mt-6 text-center text-sm text-muted-foreground"
        style={{ "--stagger": "3" } as React.CSSProperties}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
