import { redirect } from "next/navigation";
import { AlertTriangle, Cpu, HardDrive, Server } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrganization } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { getTrellisClient } from "@/lib/trellis-instance";
import type { TrellisNode } from "@/types/trellis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setNodeDrainAction } from "@/lib/actions/operations";
import { NoopButton } from "@/components/noop-button";
import { PageHeading } from "@/components/page-heading";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(0)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function formatCpu(millicores: number): string {
  if (millicores < 1000) return `${millicores}m`;
  return `${(millicores / 1000).toFixed(1)} CPU`;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  healthy: "default",
  unhealthy: "destructive",
  draining: "outline",
};

export default async function ClusterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");

  const isTrellisConfigured = !!(
    ctx.org.trellisApiUrl && ctx.org.trellisApiToken
  );

  let nodes: TrellisNode[] = [];
  let error: string | null = null;

  if (isTrellisConfigured) {
    try {
      const client = await getTrellisClient(ctx.org.id);
      nodes = await client.listNodes();
    } catch (e) {
      error =
        e instanceof Error ? e.message : "Failed to connect to Trellis.";
    }
  }

  const totalCpu = nodes.reduce((acc, n) => acc + n.cpu, 0);
  const totalMem = nodes.reduce((acc, n) => acc + n.memory, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Infrastructure"
        title="Cluster"
        description="View and manage Trellis cluster nodes."
      />

      {!isTrellisConfigured ? (
        <Card className="grid place-items-center py-20 text-center">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </span>
            <h3 className="mt-4 font-semibold">Trellis not configured</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Configure Trellis API credentials in Organization Settings to
              view cluster status.
            </p>
          </div>
        </Card>
      ) : error ? (
        <Card className="grid place-items-center py-20 text-center">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </span>
            <h3 className="mt-4 font-semibold">Connection error</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {nodes.length > 0 && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card className="relative overflow-hidden p-5">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5" />
                <Server className="h-4 w-4 text-primary" />
                <p className="mt-5 text-3xl font-bold tracking-tight">
                  {nodes.length}
                </p>
                <p className="mt-1 text-sm font-semibold">Nodes</p>
              </Card>
              <Card className="relative overflow-hidden p-5">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5" />
                <Cpu className="h-4 w-4 text-primary" />
                <p className="mt-5 text-3xl font-bold tracking-tight">
                  {formatCpu(totalCpu)}
                </p>
                <p className="mt-1 text-sm font-semibold">CPU capacity</p>
              </Card>
              <Card className="relative overflow-hidden p-5">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5" />
                <HardDrive className="h-4 w-4 text-primary" />
                <p className="mt-5 text-3xl font-bold tracking-tight">
                  {formatBytes(totalMem)}
                </p>
                <p className="mt-1 text-sm font-semibold">Memory capacity</p>
              </Card>
            </div>
          )}

          <div className="space-y-3">
            {nodes.map((node) => (
              <Card key={node.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-sm font-semibold">
                          {node.address ??
                            `${node.host ?? "unknown"}:${node.port ?? ""}`}
                        </h3>
                        <Badge
                          variant={statusVariant[node.status] ?? "outline"}
                          className="capitalize"
                        >
                          {node.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {node.os}/{node.arch} &middot; v{node.version}
                      </p>
                    </div>
                  </div>
                  <form
                    action={setNodeDrainAction.bind(
                      null,
                      node.id,
                      node.status !== "draining"
                    )}
                  >
                    <Button size="sm" variant="outline">
                      {node.status === "draining" ? "Undrain" : "Drain"}
                    </Button>
                  </form>
                </div>

                <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Capacity
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatCpu(node.cpu)} &middot; {formatBytes(node.memory)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Labels
                    </p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {Object.entries(node.labels ?? {})
                        .map(([k, v]) => `${k}=${v}`)
                        .join(", ") || "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Host volumes
                    </p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {(node.volumes ?? node.host_volumes ?? []).join(", ") ||
                        "None"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <NoopButton
                    feature="Per-allocation resource metrics"
                    variant="ghost"
                    className="h-auto p-0 text-xs text-muted-foreground"
                  >
                    Utilization unavailable until Trellis exposes metrics
                  </NoopButton>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
