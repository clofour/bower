import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getOrgMembers } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OrgSettingsForm } from '@/components/org-settings-form'

export default async function OrganizationSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const members = await getOrgMembers(ctx.org.id)
  const canEdit = ctx.role === 'owner' || ctx.role === 'admin'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage organization settings and Trellis connection
        </p>
      </div>

      <div className="space-y-6">
        <OrgSettingsForm
          orgName={ctx.org.name}
          trellisApiUrl={ctx.org.trellisApiUrl}
          hasTrellisToken={!!ctx.org.trellisApiToken}
          canEdit={canEdit}
        />

        <Card className="p-5">
          <h3 className="font-medium">Members</h3>
          <div className="mt-4 divide-y divide-border">
            {members.map((m) => (
              <div
                key={m.membership.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{m.userName}</p>
                  <p className="text-xs text-muted-foreground">{m.userEmail}</p>
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
  )
}
