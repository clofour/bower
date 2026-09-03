import { redirect } from 'next/navigation'
import { Users, Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getTeamsByOrg } from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateTeamDialog } from '@/components/create-team-dialog'

export default async function TeamsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const canManage = ctx.role === 'owner' || ctx.role === 'admin'
  const teamList = await getTeamsByOrg(ctx.org.id)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize members into teams with project-level access
          </p>
        </div>
        {canManage && <CreateTeamDialog />}
      </div>

      {teamList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a team to organize project access.
          </p>
          {canManage && (
            <div className="mt-4">
              <CreateTeamDialog />
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {teamList.map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">{team.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Created{' '}
                      {new Date(team.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
