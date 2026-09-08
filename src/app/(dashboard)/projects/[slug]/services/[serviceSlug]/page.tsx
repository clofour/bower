import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrganization, getProjectBySlug, getServiceBySlug, getServiceConfigsWithEnvironments, getDeploymentsByService } from '@/lib/queries'
import { PageHeading } from '@/components/page-heading'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { StatusDot } from '@/components/status'
import { DeploymentPoller } from '@/components/deployment-poller'
import { ServiceActions } from './service-actions'
import { ArrowLeft } from 'lucide-react'

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string; serviceSlug: string }> }) {
  const { slug, serviceSlug } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const orgCtx = await getUserOrganization(user.id)
  if (!orgCtx) redirect('/login')
  const project = await getProjectBySlug(orgCtx.org.id, slug)
  if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug)
  if (!service) notFound()

  const [configs, deployments] = await Promise.all([
    getServiceConfigsWithEnvironments(service.id),
    getDeploymentsByService(service.id, 10),
  ])

  const hasActiveDeployment = deployments.some((d) =>
    ['pending', 'planning', 'deploying'].includes(d.status)
  )

  return (
    <div className="space-y-6">
      <DeploymentPoller active={hasActiveDeployment} />

      <div className="flex items-center gap-3">
        <Link href={`/projects/${slug}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeading
          title={service.name}
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{service.type}</Badge>
              <Link href={`/projects/${slug}/services/${serviceSlug}/revisions`}>
                <Button variant="outline" size="sm">Revisions</Button>
              </Link>
            </div>
          }
        />
      </div>

      <div className="space-y-4">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No environment configurations found.
            </CardContent>
          </Card>
        ) : (
          configs.map(({ config, environment }) => (
            <Card key={config.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{environment.name}</CardTitle>
                  {environment.isLocked && <Badge variant="outline">Locked</Badge>}
                </div>
                <ServiceActions
                  serviceId={service.id}
                  environmentId={environment.id}
                  isLocked={environment.isLocked}
                  replicas={config.replicas}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground">Image</span>
                    <p className="mt-0.5 truncate font-mono text-xs">{config.image}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Replicas</span>
                    <p className="mt-0.5">{config.replicas}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPU</span>
                    <p className="mt-0.5">{config.cpu} MHz</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Memory</span>
                    <p className="mt-0.5">{Math.round(config.memory / 1024 / 1024)} MB</p>
                  </div>
                  {config.port && (
                    <div>
                      <span className="text-muted-foreground">Port</span>
                      <p className="mt-0.5">{config.port}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Strategy</span>
                    <p className="mt-0.5 capitalize">{config.deploymentStrategy.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tier</span>
                    <p className="mt-0.5 capitalize">{config.resourceTier}</p>
                  </div>
                  {config.healthCheckPath && (
                    <div>
                      <span className="text-muted-foreground">Health check</span>
                      <p className="mt-0.5 font-mono text-xs">{config.healthCheckPath}</p>
                    </div>
                  )}
                  {config.command && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Command</span>
                      <p className="mt-0.5 font-mono text-xs">{config.command}</p>
                    </div>
                  )}
                  {config.cronSchedule && (
                    <div>
                      <span className="text-muted-foreground">Schedule</span>
                      <p className="mt-0.5 font-mono text-xs">{config.cronSchedule}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Recent deployments</h3>
        {deployments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deployments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><StatusDot status={d.status} /></TableCell>
                    <TableCell className="max-w-48 truncate font-mono text-xs">{d.imageAfter}</TableCell>
                    <TableCell className="capitalize">{d.strategy.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="capitalize">{d.triggerType.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
