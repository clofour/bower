import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserOrganization,
  getProjectBySlug,
  getTeamsByOrg,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateProjectAction } from "@/lib/actions/projects";
import { NoopButton } from "@/components/noop-button";

export default async function ProjectSettingsPage({
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

  const canDelete = ctx.role === "owner" || ctx.role === "admin";
  const teams = await getTeamsByOrg(ctx.org.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage project configuration and danger zone.
        </p>
      </div>

      <Card className="p-5">
        <h3 className="font-medium">General & registry</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Slug <span className="font-mono">{project.slug}</span> &middot;
          created {new Date(project.createdAt).toLocaleDateString()}
        </p>
        <form
          action={updateProjectAction.bind(null, project.id)}
          className="mt-4 space-y-3"
        >
          <Input name="name" defaultValue={project.name} required />
          <Textarea
            name="description"
            defaultValue={project.description ?? ""}
            placeholder="Description"
          />
          <select
            name="owningTeamId"
            defaultValue={project.owningTeamId ?? ""}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">No owning team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <Input
            name="registryUrl"
            defaultValue={project.registryUrl ?? ""}
            placeholder="Registry URL"
            className="font-mono"
          />
          <NoopButton
            feature="Authenticated registry pull-through"
            className="w-full"
          >
            Add registry credentials
          </NoopButton>
          <Button>Save project</Button>
        </form>
      </Card>

      {canDelete && (
        <Card className="border-destructive/30 p-5">
          <h3 className="font-medium text-destructive">Danger zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting this project will permanently remove all services,
            environments, deployments, and routes. This cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
