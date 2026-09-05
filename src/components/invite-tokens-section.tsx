"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createInviteTokenAction,
  deleteInviteTokenAction,
} from "@/lib/actions/operations";

interface Token {
  id: string;
  token: string;
  role: string;
  usedAt: string | null;
  createdAt: string;
}

export function InviteTokensSection({
  tokens,
  canEdit,
  currentRole,
}: {
  tokens: Token[];
  canEdit: boolean;
  currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="p-5">
      <h3 className="font-medium">Invite tokens</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Generate single-use tokens to invite new members.
      </p>

      <div className="mt-4 space-y-2">
        {tokens.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm">{t.token}</code>
              <Badge variant="outline" className="capitalize">
                {t.role}
              </Badge>
              {t.usedAt && (
                <Badge variant="secondary">Used</Badge>
              )}
            </div>
            {canEdit && !t.usedAt && (
              <form
                action={deleteInviteTokenAction.bind(null, t.id)}
              >
                <Button size="sm" variant="ghost">
                  Revoke
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(() => createInviteTokenAction(formData));
          }}
          className="mt-4 flex gap-2"
        >
          <select
            name="role"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            {currentRole === "owner" && <option value="owner">Owner</option>}
          </select>
          <Button variant="secondary" disabled={isPending}>
            {isPending ? "Creating..." : "Generate token"}
          </Button>
        </form>
      )}
    </Card>
  );
}
