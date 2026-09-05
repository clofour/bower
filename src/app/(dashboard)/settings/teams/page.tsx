import { redirect } from "next/navigation";
import { Plus, Trash2, Users, X } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getOrgMembers,
  getProjectsByOrg,
  getTeamMembers,
  getTeamProjectAccessList,
  getTeamsByOrg,
  getUserOrganization,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/page-heading";
import {
  addOrganizationMemberAction,
  addTeamMemberAction,
  createTeamAction,
  deleteTeamAction,
  grantTeamProjectAction,
  removeTeamMemberAction,
  revokeTeamProjectAction,
} from "@/lib/actions/operations";

export default async function TeamsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");
  if (ctx.role === "member") redirect("/dashboard");
  const [teams, projects, orgMembers] = await Promise.all([
    getTeamsByOrg(ctx.org.id),
    getProjectsByOrg(ctx.org.id),
    getOrgMembers(ctx.org.id),
  ]);
  const detailed = await Promise.all(
    teams.map(async (team) => ({
      team,
      members: await getTeamMembers(team.id),
      access: await getTeamProjectAccessList(team.id),
    }))
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Access"
        title="Teams"
        description="Group people and assign a role independently for each project."
        actions={
          <details className="relative">
            <summary className="list-none">
              <Button asChild>
                <span>
                  <Plus className="mr-2 h-4 w-4" />
                  New team
                </span>
              </Button>
            </summary>
            <Card className="absolute right-0 z-20 mt-2 w-80 p-5 shadow-xl">
              <form action={createTeamAction} className="space-y-3">
                <Input
                  name="name"
                  placeholder="Platform engineering"
                  required
                />
                <Button className="w-full">Create team</Button>
              </form>
            </Card>
          </details>
        }
      />

      {ctx.role === "owner" && (
        <Card className="mb-6 p-5">
          <h2 className="font-semibold">Organization members</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {orgMembers.map((member) => (
              <span
                key={member.membership.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs"
              >
                <span className="font-medium">{member.userName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {member.membership.role}
                </Badge>
              </span>
            ))}
          </div>
          <form
            action={addOrganizationMemberAction}
            className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2"
          >
            <Input
              name="email"
              type="email"
              placeholder="Registered user email"
              required
            />
            <select
              name="role"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <Button variant="secondary">Add / update</Button>
          </form>
        </Card>
      )}

      {detailed.length === 0 ? (
        <Card className="grid place-items-center py-20 text-center">
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </span>
            <h3 className="mt-4 font-semibold">No teams yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a team to delegate access safely.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-5">
          {detailed.map(({ team, members, access }) => (
            <Card key={team.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{team.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {members.length} member
                    {members.length === 1 ? "" : "s"} &middot; {access.length}{" "}
                    project grant{access.length === 1 ? "" : "s"}
                  </p>
                </div>
                <form action={deleteTeamAction.bind(null, team.id)}>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </form>
              </div>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Members
                  </p>
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div
                        key={m.membership.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <div>
                          <span className="font-medium">{m.userName}</span>{" "}
                          <span className="text-xs text-muted-foreground">
                            {m.userEmail}
                          </span>
                        </div>
                        <form
                          action={removeTeamMemberAction.bind(
                            null,
                            team.id,
                            m.membership.id
                          )}
                        >
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <X className="h-3 w-3" />
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                  <form
                    action={addTeamMemberAction.bind(null, team.id)}
                    className="mt-3 flex gap-2"
                  >
                    <Input
                      name="email"
                      type="email"
                      placeholder="member@example.com"
                    />
                    <Button variant="secondary" size="sm">
                      Add
                    </Button>
                  </form>
                </div>

                <div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Project roles
                  </p>
                  <div className="space-y-1">
                    {access.map((a) => (
                      <div
                        key={a.access.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        <span>{a.projectName}</span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {a.access.role}
                          </Badge>
                          <form
                            action={revokeTeamProjectAction.bind(
                              null,
                              team.id,
                              a.access.id
                            )}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </form>
                        </span>
                      </div>
                    ))}
                  </div>
                  <form
                    action={grantTeamProjectAction.bind(null, team.id)}
                    className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2"
                  >
                    <select
                      name="projectId"
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="role"
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="deployer">Deployer</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button variant="secondary" size="sm">
                      Grant
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
