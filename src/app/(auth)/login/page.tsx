"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/auth-actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
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
          Sign in
        </h2>
        <p className="text-sm text-muted-foreground">
          Welcome back to Bower.
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totpCode">
            Authenticator code{" "}
            <span className="font-normal text-muted-foreground">
              (if enabled)
            </span>
          </Label>
          <Input
            id="totpCode"
            name="totpCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>

      <p
        className="auth-stagger mt-6 text-center text-sm text-muted-foreground"
        style={{ "--stagger": "3" } as React.CSSProperties}
      >
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
