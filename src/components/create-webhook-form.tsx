"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWebhookAction } from "@/lib/actions/integrations";

interface Service {
  id: string;
  name: string;
  slug: string;
}

interface Environment {
  id: string;
  name: string;
}

export function CreateWebhookForm({
  projectId,
  services,
  environments,
}: {
  projectId: string;
  services: Service[];
  environments: Environment[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWebhookAction(projectId, {}, formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="wh-service">Service</Label>
        <select
          id="wh-service"
          name="serviceId"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wh-env">Environment</Label>
        <select
          id="wh-env"
          name="environmentId"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select environment</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wh-provider">Provider</Label>
        <select
          id="wh-provider"
          name="provider"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="dockerhub">Docker Hub</option>
          <option value="ghcr">GitHub Container Registry</option>
          <option value="generic">Generic</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wh-mode">Deploy mode</Label>
        <select
          id="wh-mode"
          name="deployMode"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="wh-filter">Image filter</Label>
        <Input
          id="wh-filter"
          name="imageFilter"
          placeholder="Optional: tag regex"
          className="font-mono"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create webhook"}
      </Button>
    </form>
  );
}
