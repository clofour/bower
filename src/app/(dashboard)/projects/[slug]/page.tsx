import Link from 'next/link'
import { ArrowRight, Plus, X } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHeader, Metric, Panel, EmptyState, StatusPill, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { createServiceAction } from '@/lib/actions/services'
import { requireProject } from '@/lib/actions/shared'
import {
  getDeploymentsByProject,
  getEnvironmentsByProject,
  getManagedProxies,
  getProjectBySlug,
  getRoutesByProject,
  getServiceConfigs,
  getServicesByProject,
  getTemplates,
  getUserOrganization,
} from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import type { TrellisAllocation } from '@/types/trellis'

async function createService(projectSlug: string, formData: FormData) {
  'use server'
  await createServiceAction(projectSlug, formData)
}

function allocationState(allocations: TrellisAllocation[]) {
  if (!allocations.length) return { label: 'not running', className: '' }
  if (allocations.some((allocation) => allocation.health === 'unhealthy' || ['failed', 'lost'].includes(allocation.phase))) {
    return { label: 'degraded', className: 'bad' }
  }
  if (allocations.every((allocation) => allocation.phase === 'running' && allocation.health === 'healthy')) {
    return { label: 'healthy', className: 'ok' }
  }
  return { label: 'converging', className: 'pending' }
}

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const query = await searchParams
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const access = await requireProject(project.id)

  const [services, environments, deployments, routes, proxies, templates] = await Promise.all([
    getServicesByProject(project.id),
    getEnvironmentsByProject(project.id),
    getDeploymentsByProject(project.id, 8),
    getRoutesByProject(project.id),
    getManagedProxies(project.id),
    getTemplates(context.org.id),
  ])
  const configRows = await Promise.all(services.map(async (service) => ({
    service,
    configs: await getServiceConfigs(service.id),
  })))

  let allocationsByEnvironment = new Map<string, TrellisAllocation[]>()
  try {
    const client = await getTrellisClient(context.org.id)
    const rows = await Promise.all(environments.map(async (environment) => {
      const allocations = await client.listAllocations({ namespace: environment.trellisNamespace }).catch(() => [])
      return [environment.id, allocations] as const
    }))
    allocationsByEnvironment = new Map(rows)
  } catch {
    allocationsByEnvironment = new Map()
  }

  const allAllocations = [...allocationsByEnvironment.values()].flat()
  const healthyAllocations = allAllocations.filter((allocation) => allocation.phase === 'running' && allocation.health === 'healthy').length
  const showCreate = query.create === '1' && access.projectRole === 'admin'

  return (
    <>
      <PageHeader
        eyebrow="At a glance"
        title="Overview"
        description="Live service state across environments, with the latest deployment activity close at hand."
        actions={access.projectRole === 'admin' ? (
          showCreate
            ? <Link className="button button-secondary" href={'/projects/' + slug}><X size={14} />Close</Link>
            : <Link className="button button-primary" href={'/projects/' + slug + '?create=1'}><Plus size={14} />New service</Link>
        ) : undefined}
      />

      {showCreate ? (
        <Panel title="Create service" subtitle="Start from a Bower service type, optionally layering a template on top.">
          <form action={createService.bind(null, slug)} className="form-grid">
            <div className="field">
              <label>Name</label>
              <input className="input" name="name" placeholder="API" required autoFocus />
            </div>
            <div className="field">
              <label>Type</label>
              <select className="select" name="type" defaultValue="web">
                <option value="web">Web</option>
                <option value="worker">Worker</option>
                <option value="cron">Cron</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="field form-span">
              <label>Container image</label>
              <input className="input mono" name="image" placeholder="ghcr.io/acme/api:latest" required />
            </div>
            <div className="field form-span">
              <label>Template defaults</label>
              <select className="select" name="templateConfig" defaultValue="{}">
                <option value="{}">No template</option>
                {templates.map((template) => (
                  <option key={template.id} value={JSON.stringify(template.config)}>{template.name}{template.isBuiltin ? ' · built in' : ''}</option>
                ))}
              </select>
              <span className="field-hint">Templates fill defaults; every environment remains editable after creation.</span>
            </div>
            <div className="form-actions">
              <Link className="button button-secondary" href={'/projects/' + slug}>Cancel</Link>
              <button className="button button-primary" type="submit">Create service</button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div style={{ height: showCreate ? 16 : 0 }} />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <Metric label="Services" value={services.length} detail="Application workloads" />
        <Metric label="Environments" value={environments.length} detail="Promotion stages" />
        <Metric label="Healthy allocations" value={allAllocations.length ? healthyAllocations + '/' + allAllocations.length : '—'} detail={allAllocations.length ? 'Reported by Trellis' : 'No live allocations'} />
        <Metric label="Routes" value={routes.length} detail={proxies.length ? proxies.filter((row) => row.proxy.status === 'running').length + ' proxy instances running' : 'No managed ingress yet'} />
      </div>

      <div className="grid grid-2">
        <Panel title="Services" subtitle="Health is evaluated independently per environment">
          {configRows.length === 0 ? (
            <EmptyState
              title="No services"
              description={access.projectRole === 'admin' ? 'Create a service to turn an image into a deployable workload.' : 'An administrator has not created any services yet.'}
              href={access.projectRole === 'admin' ? '/projects/' + slug + '?create=1' : undefined}
              actionLabel={access.projectRole === 'admin' ? 'Create service' : undefined}
            />
          ) : (
            <div className="list">
              {configRows.map(({ service, configs }) => (
                <Link className="list-row" href={'/projects/' + slug + '/services/' + service.slug} key={service.id}>
                  <div className="list-main">
                    <div className="list-title">{service.name}</div>
                    <div className="list-meta">{service.type} · {configs[0]?.image || 'not configured'}</div>
                    <div className="service-env-strip" style={{ marginTop: 8 }}>
                      {environments.map((environment) => {
                        const config = configs.find((item) => item.environmentId === environment.id)
                        const jobName = config?.activeJobName || service.slug
                        const allocations = (allocationsByEnvironment.get(environment.id) || []).filter((allocation) => allocation.job === jobName)
                        const state = allocationState(allocations)
                        return (
                          <span className="env-chip" key={environment.id} title={state.label}>
                            <i className={state.className} />{environment.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <ArrowRight size={15} className="muted" />
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent deployments"
          subtitle="Newest first"
          action={<Link className="button button-secondary button-sm" href={'/projects/' + slug + '/deployments'}>All deployments <ArrowRight size={13} /></Link>}
        >
          {deployments.length === 0 ? (
            <EmptyState title="No releases yet" description="Deployment history begins when a service is first deployed." />
          ) : (
            <div className="list">
              {deployments.map((row) => (
                <Link className="list-row" href={'/projects/' + slug + '/deployments'} key={row.deployment.id}>
                  <div className="list-main">
                    <div className="list-title">{row.serviceName} <span className="muted">→</span> {row.environmentName}</div>
                    <div className="list-meta">{row.deployment.imageAfter} · {row.userName || row.deployment.triggerType} · {formatDate(row.deployment.createdAt)}</div>
                  </div>
                  <StatusPill status={row.deployment.status} />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
