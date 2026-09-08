import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug, getDeploymentsByProject, getDeploymentEvents } from '@/lib/queries'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/status'
import { DeploymentPoller } from '@/components/deployment-poller'
import { Rocket } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

const activeStatuses = ['pending', 'planning', 'deploying']

function formatTime(date: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function imageShort(image: string | null): string {
  if (!image) return '-'
  const parts = image.split('/')
  const last = parts[parts.length - 1]
  if (last.length > 40) return last.slice(0, 37) + '...'
  return last
}

export default async function DeploymentsPage({
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

  const rows = await getDeploymentsByProject(project.id)
  const events = await getDeploymentEvents(rows.map((row) => row.deployment.id))
  const hasActive = rows.some((r) =>
    activeStatuses.includes(r.deployment.status)
  )

  return (
    <div className="space-y-4">
      <div><h2 className="text-base font-semibold">Deployment history</h2><p className="mt-1 text-sm text-muted-foreground">Active and failed changes stay prominent; completed history remains compact.</p></div>

      <DeploymentPoller active={hasActive} />

      {rows.length === 0 ? (
        <EmptyState icon={<Rocket className="h-5 w-5" />} title="No deployment history" description="Deploy a service from its overview. Plan changes and event history will appear here." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Image change</TableHead>
              <TableHead>Triggered by</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Started / completed</TableHead>
              <TableHead>Revision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.deployment.id} className={cn(activeStatuses.includes(row.deployment.status) && 'bg-warning/10 hover:bg-warning/15', ['failed', 'rolled_back'].includes(row.deployment.status) && 'bg-destructive/8 hover:bg-destructive/12')}>
                <TableCell>
                  <StatusDot status={row.deployment.status} />
                </TableCell>
                <TableCell className="font-medium">{row.serviceName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.environmentName}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-muted-foreground">{imageShort(row.deployment.imageBefore)}</span> → {imageShort(row.deployment.imageAfter)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.userName ?? row.deployment.triggerType}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {row.deployment.strategy.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <span className="block">{formatTime(row.deployment.startedAt)}</span><span className="block text-xs">{row.deployment.completedAt ? formatTime(row.deployment.completedAt) : 'In progress'}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{row.deployment.trellisRevision ?? '—'}<details className="mt-1"><summary className="cursor-pointer text-muted-foreground hover:text-foreground">Details</summary><div className="mt-3 min-w-72 space-y-3 text-left font-sans"><p className="text-xs"><span className="font-medium">Trigger:</span> {row.deployment.triggerType.replace(/_/g, ' ')}</p>{row.deployment.planDiff != null && <details><summary className="cursor-pointer text-xs font-medium">Plan diff</summary><pre className="mt-2 max-h-56 overflow-auto rounded bg-muted p-3 font-mono text-[11px]">{JSON.stringify(row.deployment.planDiff, null, 2)}</pre></details>}{row.deployment.jobSpec != null && <details><summary className="cursor-pointer text-xs font-medium">Job specification</summary><pre className="mt-2 max-h-56 overflow-auto rounded bg-muted p-3 font-mono text-[11px]">{JSON.stringify(row.deployment.jobSpec, null, 2)}</pre></details>}{events.filter((event) => event.deploymentId === row.deployment.id).length > 0 && <details><summary className="cursor-pointer text-xs font-medium">Events ({events.filter((event) => event.deploymentId === row.deployment.id).length})</summary><ol className="mt-2 space-y-2">{events.filter((event) => event.deploymentId === row.deployment.id).map((event) => <li key={event.id} className="border-l pl-3 text-xs"><span className="font-medium">{event.type}</span><p className="text-muted-foreground">{event.message}</p></li>)}</ol></details>}</div></details></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      )}
    </div>
  )
}
