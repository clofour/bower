"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { updateOrganizationAction } from "@/lib/actions/settings";

export function OrgSettingsForm({
  orgName,
  trellisApiUrl,
  hasTrellisToken,
  canEdit,
}: {
  orgName: string;
  trellisApiUrl: string | null;
  hasTrellisToken: boolean;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateOrganizationAction(formData);
    });
  }

  return (
    <Card className="p-5">
      <h3 className="font-medium">Organization details</h3>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="org-name">Name</Label>
          <Input
            id="org-name"
            name="name"
            defaultValue={orgName}
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trellis-url">Trellis API URL</Label>
          <Input
            id="trellis-url"
            name="trellisApiUrl"
            defaultValue={trellisApiUrl ?? ""}
            placeholder="https://trellis.example.com"
            disabled={!canEdit}
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trellis-token">Trellis API token</Label>
          <Input
            id="trellis-token"
            name="trellisApiToken"
            type="password"
            placeholder={hasTrellisToken ? "••••••••" : "Paste token"}
            disabled={!canEdit}
          />
        </div>
        {canEdit && (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </form>
    </Card>
  );
}
