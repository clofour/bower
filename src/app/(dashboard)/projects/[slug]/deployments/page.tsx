import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug, getDeploymentsByProject } from '@/lib/queries'
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
import { Card, CardContent } from '@/components/ui/card'

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
  const hasActive = rows.some((r) =>
    activeStatuses.includes(r.deployment.status)
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Deployment History</h2>

      <DeploymentPoller active={hasActive} />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Rocket className="h-10 w-10 text-ink-muted mb-3" />
            <h3 className="font-medium text-lg">No deployments yet</h3>
            <p className="text-sm text-ink-muted mt-1">
              Deploy a service to see its history here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Triggered by</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.deployment.id}>
                <TableCell>
                  <StatusDot status={row.deployment.status} />
                </TableCell>
                <TableCell className="font-medium">{row.serviceName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{row.environmentName}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {imageShort(row.deployment.imageAfter)}
                </TableCell>
                <TableCell className="text-ink-muted">
                  {row.userName ?? row.deployment.triggerType}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {row.deployment.strategy.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-ink-muted text-sm">
                  {formatTime(row.deployment.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
