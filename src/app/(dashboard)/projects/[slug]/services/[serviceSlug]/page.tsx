import { redirect, notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { Layers, Rocket, Terminal, Pause, Play, RotateCcw } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getEnvironmentsByProject,
  getServiceConfigs,
  getDeploymentsByService,
} from '@/lib/queries'
import { db } from '@/db'
import { services } from '@/db/schema'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DeployButton } from '@/components/deploy-button'

const typeColors: Record<string, string> = {
  web: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  worker: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  cron: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  custom: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb < 1024) return `${mb.toFixed(0)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

function formatCpu(millicores: number): string {
  if (millicores < 1000) return `${millicores}m`
  return `${(millicores / 1000).toFixed(1)} CPU`
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string; serviceSlug: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const { slug, serviceSlug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug)
  if (!project) notFound()

  const svcRows = await db
    .select()
    .from(services)
    .where(and(eq(services.projectId, project.id), eq(services.slug, serviceSlug)))
    .limit(1)
  if (svcRows.length === 0) notFound()
  const svc = svcRows[0]

  const [envList, configs, recentDeploys] = await Promise.all([
    getEnvironmentsByProject(project.id),
    getServiceConfigs(svc.id),
    getDeploymentsByService(svc.id, 10),
  ])

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <a href={`/projects/${slug}`} className="hover:text-foreground transition-colors">
            {project.name}
          </a>
          <span>/</span>
          <span className="text-foreground font-medium">{svc.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{svc.name}</h1>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[svc.type] ?? typeColors.custom}`}
          >
            {svc.type}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Environment Configurations</h2>
          {envList.map((env) => {
            const config = configs.find((c) => c.environmentId === env.id)
            if (!config) return null

            return (
              <Card key={env.id} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{env.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {env.trellisNamespace}
                    </p>
                  </div>
                  <DeployButton serviceId={svc.id} environmentId={env.id} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Image</p>
                    <p className="text-sm font-mono truncate">{config.image}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Strategy</p>
                    <p className="text-sm">{config.deploymentStrategy.replace('_', '-')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resources</p>
                    <p className="text-sm">
                      {formatCpu(config.cpu)} / {formatBytes(config.memory)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Replicas</p>
                    <p className="text-sm">{config.replicas}</p>
                  </div>
                  {config.port && (
                    <div>
                      <p className="text-xs text-muted-foreground">Port</p>
                      <p className="text-sm">{config.port}</p>
                    </div>
                  )}
                  {config.healthCheckPath && (
                    <div>
                      <p className="text-xs text-muted-foreground">Health Check</p>
                      <p className="text-sm font-mono">{config.healthCheckPath}</p>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Actions</h2>
          <Card className="p-4 space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Terminal className="mr-2 h-4 w-4" />
              Exec into container
              <Badge variant="outline" className="ml-auto text-xs">
                Not yet available
              </Badge>
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Pause className="mr-2 h-4 w-4" />
              Pause service
              <Badge variant="outline" className="ml-auto text-xs">
                Not yet available
              </Badge>
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart service
              <Badge variant="outline" className="ml-auto text-xs">
                Not yet available
              </Badge>
            </Button>
          </Card>

          <h2 className="text-lg font-semibold">Recent Deployments</h2>
          {recentDeploys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deployments yet.</p>
          ) : (
            <div className="space-y-2">
              {recentDeploys.map((d) => (
                <Card key={d.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          d.status === 'healthy'
                            ? 'border-green-500/30 text-green-600 dark:text-green-400'
                            : d.status === 'failed'
                              ? 'border-red-500/30 text-red-600 dark:text-red-400'
                              : ''
                        }`}
                      >
                        {d.status}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                        {d.imageAfter}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
