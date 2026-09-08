import { RefreshCw } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHeader, Panel, StatusPill, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { refreshDeploymentStatusesAction } from '@/lib/actions/services'
import { requireProject } from '@/lib/actions/shared'
import {
  getDeploymentEvents,
  getDeploymentsByProject,
  getEnvironmentsByProject,
  getProjectBySlug,
  getServicesByProject,
  getUserOrganization,
} from '@/lib/queries'

export default async function DeploymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const filters = await searchParams
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  await requireProject(project.id)

  const [allRows, services, environments] = await Promise.all([
    getDeploymentsByProject(project.id, 100),
    getServicesByProject(project.id),
    getEnvironmentsByProject(project.id),
  ])

  const service = typeof filters.service === 'string' ? filters.service : ''
  const environment = typeof filters.environment === 'string' ? filters.environment : ''
  const status = typeof filters.status === 'string' ? filters.status : ''
  const rows = allRows.filter((row) =>
    (!service || row.deployment.serviceId === service) &&
    (!environment || row.deployment.environmentId === environment) &&
    (!status || row.deployment.status === status)
  )
  const events = await getDeploymentEvents(rows.map((row) => row.deployment.id))
  const eventsByDeployment = new Map<string, typeof events>()
  for (const event of events) {
    const list = eventsByDeployment.get(event.deploymentId) || []
    list.push(event)
    eventsByDeployment.set(event.deploymentId, list)
  }

  return (
    <>
      <PageHeader
        eyebrow="Release history"
        title="Deployments"
        description="Every release, promotion, rollback, plan, and convergence event Bower has recorded."
        actions={
          <form action={refreshDeploymentStatusesAction.bind(null, project.id)}>
            <button className="button button-secondary" type="submit"><RefreshCw size={14} />Refresh status</button>
          </form>
        }
      />

      <Panel>
        <form className="filterbar" method="get">
          <div className="field">
            <label>Service</label>
            <select className="select" name="service" defaultValue={service}>
              <option value="">All services</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Environment</label>
            <select className="select" name="environment" defaultValue={environment}>
              <option value="">All environments</option>
              {environments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select className="select" name="status" defaultValue={status}>
              <option value="">All statuses</option>
              {['pending', 'planning', 'deploying', 'healthy', 'failed', 'rolled_back'].map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <button className="button button-secondary" type="submit">Filter</button>
        </form>

        {rows.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No matching deployments</div>
            <div>Release records will appear here after a service is deployed.</div>
          </div>
        ) : (
          <div>
            {rows.map((row) => {
              const deploymentEvents = eventsByDeployment.get(row.deployment.id) || []
              return (
                <details className="disclosure" key={row.deployment.id}>
                  <summary>
                    <div className="row" style={{ minWidth: 0 }}>
                      <StatusPill status={row.deployment.status} />
                      <div className="truncate">
                        <span className="strong">{row.serviceName}</span>
                        <span className="muted"> → {row.environmentName}</span>
                        <span className="muted small"> · {row.deployment.imageAfter}</span>
                      </div>
                    </div>
                    <span className="small muted">{formatDate(row.deployment.createdAt)}</span>
                  </summary>
                  <div className="disclosure-body">
                    <div className="grid grid-2">
                      <div>
                        <div className="key-value"><div className="key-label">Triggered by</div><div>{row.userName || row.deployment.triggerType}</div></div>
                        <div className="key-value"><div className="key-label">Strategy</div><div>{row.deployment.strategy.replaceAll('_', ' ')}</div></div>
                        <div className="key-value"><div className="key-label">Revision</div><div>{row.deployment.trellisRevision ?? '—'}</div></div>
                        <div className="key-value"><div className="key-label">Previous image</div><div className="mono small">{row.deployment.imageBefore || '—'}</div></div>
                        <div className="key-value"><div className="key-label">Completed</div><div>{formatDate(row.deployment.completedAt)}</div></div>
                      </div>
                      <div>
                        <div className="strong small" style={{ marginBottom: 10 }}>Convergence timeline</div>
                        {deploymentEvents.length ? (
                          <div className="timeline">
                            {deploymentEvents.map((event) => (
                              <div className="timeline-item" key={event.id}>
                                <div className="timeline-title">{event.message}</div>
                                <div className="timeline-meta">{event.type} · {formatDate(event.createdAt)}</div>
                              </div>
                            ))}
                          </div>
                        ) : <div className="muted small">No detailed events recorded.</div>}
                      </div>
                    </div>
                    {row.deployment.planDiff ? (
                      <>
                        <div className="separator" />
                        <div className="strong small" style={{ marginBottom: 8 }}>Trellis plan</div>
                        <pre className="code-panel">{JSON.stringify(row.deployment.planDiff, null, 2)}</pre>
                      </>
                    ) : null}
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </Panel>
    </>
  )
}
