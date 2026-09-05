"use client";

import { useState } from "react";
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
import { Terminal } from "lucide-react";
import type { TrellisAllocation } from "@/types/trellis";

export function ExecDialog({
  serviceId,
  allocations,
}: {
  serviceId: string;
  allocations: TrellisAllocation[];
}) {
  const [open, setOpen] = useState(false);

  const running = allocations.filter((a) => a.phase === "running");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Terminal className="mr-2 h-4 w-4" />
          Exec
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Execute command</DialogTitle>
        </DialogHeader>
        <form
          action={`/api/trellis/exec`}
          method="POST"
          className="space-y-4"
        >
          <input type="hidden" name="serviceId" value={serviceId} />
          <div className="space-y-2">
            <Label htmlFor="exec-alloc">Allocation</Label>
            <select
              id="exec-alloc"
              name="allocationId"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-mono"
            >
              {running.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id.slice(0, 12)} ({a.address ?? "no address"})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exec-cmd">Command</Label>
            <Input
              id="exec-cmd"
              name="command"
              defaultValue="/bin/sh"
              className="font-mono"
            />
          </div>
          <Button type="submit" className="w-full">
            Connect
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
