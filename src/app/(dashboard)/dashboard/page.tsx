import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  Gauge,
  Rocket,
  Server,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getDeploymentsByProject,
  getProjectsForUser,
  getServicesByProject,
  getUserOrganization,
} from "@/lib/queries";
import { getTrellisClient } from "@/lib/trellis-instance";
import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { Status } from "@/components/status";

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");
  const projects = await getProjectsForUser(ctx.org.id, user.id, ctx.role);
  const details = await Promise.all(
    projects.map(async (project) => ({
      project,
      services: await getServicesByProject(project.id),
      deployments: await getDeploymentsByProject(project.id, 6),
    }))
  );
  const allDeployments = details
    .flatMap((item) => item.deployments)
    .sort(
      (a, b) =>
        +new Date(b.deployment.createdAt) - +new Date(a.deployment.createdAt)
    )
    .slice(0, 8);
  let nodes = 0;
  let clusterState = "Not connected";
  if (ctx.org.trellisApiUrl && ctx.org.trellisApiToken)
    try {
      const list = await (await getTrellisClient(ctx.org.id)).listNodes();
      nodes = list.length;
      clusterState = list.some((node) => node.status === "unhealthy")
        ? "Needs attention"
        : "Healthy";
    } catch {
      clusterState = "Unavailable";
    }
  const serviceCount = details.reduce(
    (sum, item) => sum + item.services.length,
    0
  );
  const healthyDeployments = allDeployments.filter(
    (item) => item.deployment.status === "healthy"
  ).length;

  const stats = [
    {
      icon: FolderKanban,
      label: "Projects",
      value: projects.length,
      detail: "Organized workloads",
    },
    {
      icon: Activity,
      label: "Services",
      value: serviceCount,
      detail: "Across all environments",
    },
    {
      icon: Server,
      label: "Cluster nodes",
      value: nodes,
      detail: clusterState,
    },
    {
      icon: Gauge,
      label: "Recent healthy",
      value: healthyDeployments,
      detail: `of ${allDeployments.length} deployments`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        eyebrow="Control plane"
        title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${user.name.split(" ")[0]}.`}
        description="A focused view of what is shipping, what is healthy, and what needs your attention."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden p-5">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5" />
            <stat.icon className="h-4 w-4 text-primary" />
            <p className="mt-5 text-3xl font-bold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-semibold">{stat.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stat.detail}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Projects</h2>
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3">
            {details.slice(0, 4).map(({ project, services }) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="group flex items-center justify-between p-5 transition-colors hover:border-primary/30">
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {services.length} service
                      {services.length === 1 ? "" : "s"} &middot;{" "}
                      {project.description || "No description"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Deployment feed</h2>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </div>
          <Card className="divide-y overflow-hidden">
            {allDeployments.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Your deployment activity will appear here.
              </div>
            ) : (
              allDeployments.map((row) => (
                <div
                  key={row.deployment.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row.serviceName}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {row.deployment.imageAfter}
                    </p>
                  </div>
                  <Status value={row.deployment.status} />
                </div>
              ))
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
