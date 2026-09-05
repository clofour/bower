import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserOrganization,
  getOrgMembers,
  getInviteTokens,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/page-heading";
import { OrgSettingsForm } from "@/components/org-settings-form";
import { InviteTokensSection } from "@/components/invite-tokens-section";

export default async function OrganizationSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ctx = await getUserOrganization(user.id);
  if (!ctx) redirect("/login");

  const [members, tokens] = await Promise.all([
    getOrgMembers(ctx.org.id),
    getInviteTokens(ctx.org.id),
  ]);

  const canEdit = ctx.role === "owner" || ctx.role === "admin";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        eyebrow="Settings"
        title="Organization"
        description="Manage organization settings and Trellis connection."
      />

      <div className="space-y-6">
        <OrgSettingsForm
          orgName={ctx.org.name}
          trellisApiUrl={ctx.org.trellisApiUrl}
          hasTrellisToken={!!ctx.org.trellisApiToken}
          canEdit={canEdit}
        />

        <InviteTokensSection
          tokens={tokens}
          canEdit={canEdit}
          currentRole={ctx.role}
        />

        <Card className="p-5">
          <h3 className="font-semibold">Members</h3>
          <div className="mt-4 divide-y divide-border">
            {members.map((m) => (
              <div
                key={m.membership.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{m.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.userEmail}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {m.membership.role}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
