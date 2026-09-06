"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  updateAccountAction,
  changePasswordAction,
  beginTotpAction,
  disableTotpAction,
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/lib/actions/settings";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date;
}

export function AccountSettingsForm({
  userName,
  userEmail,
  totpEnabled,
  apiKeys,
}: {
  userName: string;
  userEmail: string;
  totpEnabled: boolean;
  apiKeys: ApiKey[];
}) {
  const [profilePending, startProfileTransition] = useTransition();
  const [pwPending, startPwTransition] = useTransition();
  const [totpPending, startTotpTransition] = useTransition();
  const [keyPending, startKeyTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="font-medium">Profile</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startProfileTransition(async () => {
              await updateAccountAction(new FormData(e.currentTarget));
            });
          }}
          className="mt-4 space-y-3"
        >
          <div className="space-y-2">
            <Label htmlFor="acc-name">Name</Label>
            <Input id="acc-name" name="name" defaultValue={userName} />
          </div>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
          <Button type="submit" disabled={profilePending}>
            {profilePending ? "Saving..." : "Update profile"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium">Password</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startPwTransition(async () => {
              await changePasswordAction(new FormData(e.currentTarget));
            });
          }}
          className="mt-4 space-y-3"
        >
          <div className="space-y-2">
            <Label htmlFor="acc-current">Current password</Label>
            <Input
              id="acc-current"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acc-new">New password</Label>
            <Input
              id="acc-new"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={pwPending}>
            {pwPending ? "Changing..." : "Change password"}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Two-factor authentication</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {totpEnabled
                ? "TOTP is enabled on your account."
                : "Add an authenticator app for extra security."}
            </p>
          </div>
          <Switch
            checked={totpEnabled}
            disabled={totpPending}
            onCheckedChange={() =>
              startTotpTransition(async () => {
                if (totpEnabled) {
                  await disableTotpAction();
                } else {
                  await beginTotpAction();
                }
              })
            }
          />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-medium">API keys</h3>
        <div className="mt-4 space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium">{key.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {key.keyPrefix}...
                </span>
              </div>
              <form
                action={async (_: FormData) => {
                  await revokeApiKeyAction(key.id);
                }}
              >
                <Button size="sm" variant="ghost">
                  Revoke
                </Button>
              </form>
            </div>
          ))}
        </div>
        {newKey && (
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              Copy this key now — you will not see it again.
            </p>
            <code className="mt-1 block break-all font-mono text-sm">
              {newKey}
            </code>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get("name") as string;
            startKeyTransition(async () => {
              const result = await createApiKeyAction(name);
              if (result && "token" in result && result.token) setNewKey(result.token);
            });
          }}
          className="mt-4 flex gap-2"
        >
          <Input name="name" placeholder="Key name" required />
          <Button variant="secondary" disabled={keyPending}>
            {keyPending ? "Creating..." : "Create key"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
