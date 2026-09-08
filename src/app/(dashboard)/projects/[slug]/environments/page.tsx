import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getEnvironmentsByProject,
} from '@/lib/queries'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock, Layers } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateEnvironmentDialog, EnvironmentActions } from './environment-actions'

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
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4"><div><h2 className="text-base font-semibold">Promotion path</h2><p className="mt-1 text-sm text-muted-foreground">Lower order environments promote first. Locked targets reject deployments and configuration changes.</p></div>{environments.length > 0 && <CreateEnvironmentDialog projectId={project.id} />}</div>

      {environments.length === 0 ? (
        <EmptyState icon={<Layers className="h-5 w-5" />} title="Create a deployment environment" description="Define the first namespace, replica defaults, resource tier, and variables for this project." action={<CreateEnvironmentDialog projectId={project.id} prominent />} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Namespace</TableHead>
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
                  {env.trellisNamespace}
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
                  <EnvironmentActions projectId={project.id} environment={env} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
