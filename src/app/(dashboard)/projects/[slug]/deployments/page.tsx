import { redirect, notFound } from 'next/navigation'
import { Rocket } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getDeploymentsByProject,
} from '@/lib/queries'
import { Card } from '@/components/ui/card'
import { DeploymentPoller } from '@/components/deployment-poller'

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  planning: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  deploying: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  healthy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  rolled_back: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
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
  if (!project) notFound()

  const deploymentList = await getDeploymentsByProject(project.id)

  return (
    <div>
      <DeploymentPoller projectId={project.id} active={deploymentList.some((item) => ['pending', 'planning', 'deploying'].includes(item.deployment.status))} />
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Deployments</h2>
        <p className="text-sm text-muted-foreground">
          History of all deployments across services and environments.
        </p>
      </div>

      {deploymentList.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Rocket className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No deployments yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deployments will appear here once you deploy a service.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {deploymentList.map((d) => (
            <Card key={d.deployment.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{d.serviceName}</h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[d.deployment.status] ?? ''}`}
                      >
                        {d.deployment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                      {d.deployment.imageAfter}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{d.deployment.strategy}</p>
                  <p>
                    {new Date(d.deployment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
