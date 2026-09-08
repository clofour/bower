import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getTeamsByOrg, getTeamMembers, getTeamProjectAccessList } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TeamActions } from './team-actions'
import { Users } from 'lucide-react'

export default async function TeamsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')

  const teams = await getTeamsByOrg(orgCtx.org.id)

  const teamsWithDetails = await Promise.all(
    teams.map(async (team) => {
      const [members, access] = await Promise.all([
        getTeamMembers(team.id),
        getTeamProjectAccessList(team.id),
      ])
      return { team, members, access }
    })
  )

  return (
    <div className="space-y-6">
      <PageHeading
        title="Teams"
        description="Manage teams and their project access."
        actions={<TeamActions mode="create" />}
      />

      {teamsWithDetails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No teams yet. Create one to organize project access.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teamsWithDetails.map(({ team, members, access }) => (
            <Card key={team.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <Badge variant="secondary">{members.length} members</Badge>
                </div>
                <TeamActions mode="delete" teamId={team.id} teamName={team.name} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Members</h4>
                  {members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No members.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((m) => (
                          <TableRow key={m.membership.id}>
                            <TableCell>{m.userName}</TableCell>
                            <TableCell className="text-muted-foreground">{m.userEmail}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                <Separator />
                <div>
                  <h4 className="mb-2 text-sm font-medium">Project access</h4>
                  {access.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No project access granted.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {access.map((a) => (
                          <TableRow key={a.access.id}>
                            <TableCell>{a.projectName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{a.access.role}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
