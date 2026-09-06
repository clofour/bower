import { redirect, notFound } from "next/navigation";
import { Layers, ArrowRight, Boxes } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserOrganization,
  getProjectBySlug,
  getServicesByProject,
  getTemplates,
  getEnvironmentsByProject,
  getServiceConfigsWithEnvironments,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateServiceDialog } from "@/components/create-service-dialog";
import { BUILTIN_TEMPLATES } from "@/lib/builtin-templates";
import { getTrellisClient } from "@/lib/trellis-instance";
import { Status } from "@/components/status";

const typeColors: Record<string, string> = {
  web: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  worker: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  cron: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  custom: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export default async function ProjectServicesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");

  const { slug } = await params;
  const project = await getProjectBySlug(ctx.org.id, slug);
  if (!project) notFound();

  const [serviceList, customTemplates, environments] = await Promise.all([
    getServicesByProject(project.id),
    getTemplates(ctx.org.id),
    getEnvironmentsByProject(project.id),
  ]);
  const templates = [
    ...BUILTIN_TEMPLATES,
    ...customTemplates.map((template) => ({
      name: template.name,
      type: template.type,
      config: template.config as Record<string, unknown>,
    })),
  ];
  const health = new Map<string, string>();
  if (ctx.org.trellisApiUrl && ctx.org.trellisApiToken) {
    const client = await getTrellisClient(ctx.org.id);
    await Promise.all(
      serviceList.map(async (service) => {
        const configs = await getServiceConfigsWithEnvironments(service.id);
        await Promise.all(
          configs.map(async ({ config, environment }) => {
            try {
              const allocations = await client.listAllocations({
                namespace: environment.trellisNamespace,
                job: config.activeJobName || service.slug,
              });
              const revision = allocations.length
                ? Math.max(...allocations.map((item) => item.job_revision))
                : 0;
              const current = allocations.filter(
                (item) =>
                  item.job_revision === revision && item.phase !== "stopped"
              );
              const value =
                current.length === 0
                  ? "pending"
                  : current.some(
                        (item) =>
                          item.phase === "failed" ||
                          item.phase === "lost" ||
                          item.health === "unhealthy"
                      )
                    ? "failed"
                    : current.every(
                          (item) =>
                            item.phase === "running" &&
                            item.health === "healthy"
                        )
                      ? "healthy"
                      : "deploying";
              health.set(`${service.id}:${environment.id}`, value);
            } catch {
              health.set(`${service.id}:${environment.id}`, "unknown");
            }
          })
        );
      })
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services</h2>
        <CreateServiceDialog projectSlug={slug} templates={templates} />
      </div>

      {serviceList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a service to start deploying.
          </p>
          <div className="mt-4">
            <CreateServiceDialog projectSlug={slug} templates={templates} />
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {serviceList.map((svc) => (
            <Link
              key={svc.id}
              href={`/projects/${slug}/services/${svc.slug}`}
            >
              <Card className="group overflow-hidden p-0 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <div className="h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Boxes className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{svc.name}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${typeColors[svc.type] ?? typeColors.custom}`}
                        >
                          {svc.type}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {svc.slug}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {environments.map((environment) => (
                          <span
                            key={environment.id}
                            className="flex items-center gap-1 text-[11px] text-muted-foreground"
                          >
                            {environment.name}
                            <Status
                              value={
                                health.get(
                                  `${svc.id}:${environment.id}`
                                ) ?? "pending"
                              }
                            />
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
