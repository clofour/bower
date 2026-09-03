import { redirect, notFound } from 'next/navigation'
import { Rocket } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  getUserOrganization,
  getProjectBySlug,
  getDeploymentsByProject,
  getDeploymentEvents,
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
  params, searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ environment?: string; service?: string; user?: string; status?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const ctx = await getUserOrganization(user.id)
  if (!ctx) redirect('/login')

  const { slug } = await params
  const project = await getProjectBySlug(ctx.org.id, slug)
  if (!project) notFound()

  const deploymentList = await getDeploymentsByProject(project.id)
  const filters = await searchParams
  const filtered = deploymentList.filter((item) => (!filters.environment || item.environmentName === filters.environment) && (!filters.service || item.serviceName === filters.service) && (!filters.user || (item.userName || 'Automation') === filters.user) && (!filters.status || item.deployment.status === filters.status))
  const events = await getDeploymentEvents(filtered.map((item) => item.deployment.id))

  return (
    <div>
      <DeploymentPoller active={deploymentList.some((item) => ['pending', 'planning', 'deploying'].includes(item.deployment.status))} />
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Deployments</h2>
        <p className="text-sm text-muted-foreground">
          History of all deployments across services and environments.
        </p>
      </div>
      <form className="mb-5 grid gap-2 rounded-xl border bg-muted/30 p-3 sm:grid-cols-4"><input name="environment" defaultValue={filters.environment ?? ''} placeholder="Environment" className="h-9 rounded-md border bg-background px-3 text-sm" /><input name="service" defaultValue={filters.service ?? ''} placeholder="Service" className="h-9 rounded-md border bg-background px-3 text-sm" /><input name="user" defaultValue={filters.user ?? ''} placeholder="User" className="h-9 rounded-md border bg-background px-3 text-sm" /><select name="status" defaultValue={filters.status ?? ''} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Any status</option>{Object.keys(statusStyles).map((status) => <option key={status}>{status}</option>)}</select><button className="sr-only">Filter</button></form>

      {filtered.length === 0 ? (
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
          {filtered.map((d) => (
            <Card key={d.deployment.id} className="p-4"><details>
              <summary className="list-none cursor-pointer">
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
                    <p className="mt-1 text-xs text-muted-foreground">{d.environmentName} · {d.userName || 'Automation'} · {d.deployment.triggerType}</p>
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
              </summary><div className="mt-4 grid gap-4 border-t pt-4 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Semantic plan</p><pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-muted p-3 text-xs">{JSON.stringify(d.deployment.planDiff, null, 2)}</pre></div><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Convergence timeline</p><div className="mt-2 space-y-2">{events.filter((event) => event.deploymentId === d.deployment.id).map((event) => <div key={event.id} className="rounded-xl border p-3 text-xs"><b>{event.type.replace('_', ' ')}</b><p className="mt-1 text-muted-foreground">{event.message}</p><time className="mt-1 block text-[10px] text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</time></div>)}</div></div></div></details>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
