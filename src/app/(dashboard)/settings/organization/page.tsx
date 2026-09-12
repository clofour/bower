import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getOrgMembers, getOrganizationTokens } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { OrgSettingsForm } from '@/components/org-settings-form'
import { InviteTokensSection } from '@/components/invite-tokens-section'

export default async function OrganizationSettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  const [members, tokens] = await Promise.all([
    getOrgMembers(orgCtx.org.id),
    getOrganizationTokens(orgCtx.org.id),
  ])

  return (
    <div className="space-y-8">
      <PageHeading title="Organization" description="Manage your organization settings and members." />

      <OrgSettingsForm
        org={{
          id: orgCtx.org.id,
          name: orgCtx.org.name,
          slug: orgCtx.org.slug,
        }}
      />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-ink-muted">No members found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.membership.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {m.userAvatar && <AvatarImage src={m.userAvatar} />}
                          <AvatarFallback className="text-xs">
                            {(m.userName ?? '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {m.userName}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-muted">{m.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant={m.membership.role === 'owner' ? 'default' : 'secondary'}>
                        {m.membership.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      <InviteTokensSection
        tokens={tokens.map((t) => ({
          token: {
            id: t.token.id,
            tokenPrefix: t.token.tokenPrefix,
            role: t.token.role,
            note: t.token.note,
            usedAt: t.token.usedAt?.toISOString() ?? null,
            expiresAt: t.token.expiresAt?.toISOString() ?? null,
            createdAt: t.token.createdAt.toISOString(),
          },
          createdByName: t.createdByName,
        }))}
        role={orgCtx.role}
      />
    </div>
  )
}
