import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getEnvironmentsByProject,
} from '@/lib/queries'
import { toggleEnvironmentLockAction } from '@/lib/actions/operations'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, Unlock, Layers } from 'lucide-react'

export default async function EnvironmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const { slug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug)
  if (!project) redirect('/projects')

  const environments = await getEnvironmentsByProject(project.id)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Environments</h2>

      {environments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-medium text-lg">No environments</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create an environment to begin configuring deployments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Resource Tier</TableHead>
              <TableHead>Default Replicas</TableHead>
              <TableHead>Promotion Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {environments.map((env) => (
              <TableRow key={env.id}>
                <TableCell className="font-medium">{env.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {env.slug}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{env.resourceTier}</Badge>
                </TableCell>
                <TableCell>{env.defaultReplicas}</TableCell>
                <TableCell>{env.promotionOrder}</TableCell>
                <TableCell>
                  {env.isLocked ? (
                    <Badge variant="warning">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Unlock className="h-3 w-3 mr-1" />
                      Unlocked
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <form
                    action={toggleEnvironmentLockAction.bind(
                      null,
                      project.id,
                      env.id,
                      !env.isLocked
                    )}
                  >
                    <Button variant="ghost" size="sm" type="submit">
                      {env.isLocked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5 mr-1" />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 mr-1" />
                          Lock
                        </>
                      )}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
