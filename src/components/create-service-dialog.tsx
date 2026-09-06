"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createServiceAction } from "@/lib/actions/services";

interface Template {
  name: string;
  type: string;
  config: Record<string, unknown>;
}

export function CreateServiceDialog({
  projectSlug,
  templates,
}: {
  projectSlug: string;
  templates: Template[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("projectSlug", projectSlug);
    startTransition(async () => {
      const result = await createServiceAction(projectSlug, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="cs-name">Name</Label>
            <Input id="cs-name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-type">Type</Label>
            <select
              id="cs-type"
              name="type"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="web">Web</option>
              <option value="worker">Worker</option>
              <option value="cron">Cron</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="cs-template">Template</Label>
              <select
                id="cs-template"
                name="template"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="cs-image">Container image</Label>
            <Input
              id="cs-image"
              name="image"
              placeholder="ghcr.io/org/app:latest"
              className="font-mono"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create service"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
