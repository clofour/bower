import { notFound, redirect } from "next/navigation";
import { ArrowLeft, GitCommitVertical, FileJson } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getEnvironmentsByProject,
  getProjectBySlug,
  getServiceBySlug,
  getUserOrganization,
} from "@/lib/queries";
import { getTrellisClient } from "@/lib/trellis-instance";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TrellisJobRevision } from "@/types/trellis";

export default async function RevisionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; serviceSlug: string }>;
  searchParams: Promise<{ environment?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");
  const { slug, serviceSlug } = await params;
  const project = await getProjectBySlug(ctx.org.id, slug);
  if (!project) notFound();
  const service = await getServiceBySlug(project.id, serviceSlug);
  if (!service) notFound();
  const envs = await getEnvironmentsByProject(project.id);
  const selectedSlug = (await searchParams).environment ?? envs[0]?.slug;
  const env = envs.find((e) => e.slug === selectedSlug) ?? envs[0];
  let revisions: TrellisJobRevision[] = [];
  let error = "";
  if (env && ctx.org.trellisApiUrl && ctx.org.trellisApiToken) {
    try {
      const client = await getTrellisClient(ctx.org.id);
      revisions = await client.getJobRevisions(
        service.slug,
        env.trellisNamespace
      );
    } catch (err) {
      error =
        err instanceof Error ? err.message : "Unable to reach Trellis.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <a href={`/projects/${slug}/services/${serviceSlug}`}>
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </a>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {service.name}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            Revision history
          </h2>
          {env && (
            <p className="mt-1 text-sm text-muted-foreground">
              Persisted Trellis job revisions for{" "}
              <span className="font-medium text-foreground">{env.name}</span>
            </p>
          )}
        </div>
      </div>

      {envs.length > 1 && (
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
          {envs.map((e) => (
            <a
              key={e.id}
              href={`?environment=${e.slug}`}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                e.slug === selectedSlug
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {e.name}
            </a>
          ))}
        </div>
      )}

      {error ? (
        <Card className="border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </Card>
      ) : revisions.length === 0 ? (
        <Card className="grid place-items-center py-20 text-center">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
              <GitCommitVertical className="h-5 w-5 text-primary" />
            </span>
            <h3 className="mt-4 font-semibold">No revisions found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisions appear after the first deployment to this environment.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...revisions].reverse().map((rev) => (
            <Card key={rev.revision} className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-primary" />
                  <span className="font-mono text-sm font-semibold">
                    Revision {rev.revision}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {new Date(rev.created_at).toLocaleString()}
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <pre className="p-5 font-mono text-xs leading-relaxed text-muted-foreground">
                  {JSON.stringify(rev.spec, null, 2)}
                </pre>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
