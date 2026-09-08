import Link from 'next/link'
import { Activity, ArrowUpRight, Pause, Play, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  PageHeader,
  Panel,
  Pill,
  StatusPill,
  formatBytes,
  formatDate,
} from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import {
  deleteServiceAction,
  deleteSidecarAction,
  deployServiceAction,
  promoteServiceAction,
  restartServiceAction,
  resumeServiceAction,
  rollbackServiceAction,
  scaleServiceAction,
  stopAllocationAction,
  updateServiceConfigAction,
  upsertSidecarAction,
} from '@/lib/actions/services'
import { requireService } from '@/lib/actions/shared'
import {
  getDeploymentsByService,
  getProjectBySlug,
  getRoutesByProject,
  getSecretsByProject,
  getServiceBySlug,
  getServiceConfigsWithEnvironments,
  getSidecars,
  getUserOrganization,
} from '@/lib/queries'
import { getTrellisClient } from '@/lib/trellis-instance'
import type { TrellisJob } from '@/types/trellis'

function lines(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return Object.entries(value as Record<string, unknown>).map(([key, item]) => key + '=' + String(item)).join('\n')
}

function json(value: unknown, fallback: unknown) {
  return JSON.stringify(value ?? fallback, null, 2)
}

async function scaleFromForm(serviceId: string, environmentId: string, formData: FormData) {
  'use server'
  await scaleServiceAction(serviceId, environmentId, Number(formData.get('replicas')))
}

async function deleteService(serviceId: string, projectSlug: string) {
  'use server'
  await deleteServiceAction(serviceId, projectSlug)
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string; serviceSlug: string }>
}) {
  const { slug, serviceSlug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const service = await getServiceBySlug(project.id, serviceSlug)
  if (!service) notFound()
  const access = await requireService(service.id)

  const [configRows, deployments, projectSecrets, projectRoutes] = await Promise.all([
    getServiceConfigsWithEnvironments(service.id),
    getDeploymentsByService(service.id, 30),
    getSecretsByProject(project.id),
    getRoutesByProject(project.id),
  ])
  const sidecarsByConfig = new Map<string, Awaited<ReturnType<typeof getSidecars>>>()
  await Promise.all(configRows.map(async ({ config }) => {
    sidecarsByConfig.set(config.id, await getSidecars(config.id))
  }))

  let jobs = new Map<string, TrellisJob | null>()
  try {
    const client = await getTrellisClient(context.org.id)
    const rows = await Promise.all(configRows.map(async ({ config, environment }) => {
      const jobName = config.activeJobName || service.slug
      const job = await client.getJob(jobName, environment.trellisNamespace).catch(() => null)
      return [environment.id, job] as const
    }))
    jobs = new Map(rows)
  } catch {
    jobs = new Map()
  }

  const canOperate = access.projectRole !== 'viewer'
  const canConfigure = access.projectRole === 'admin'
  const routes = projectRoutes.filter((row) => row.route.serviceId === service.id)
  const runningAllocations = [...jobs.values()].flatMap((job) => job?.allocations || []).filter((allocation) => allocation.phase === 'running').length

  return (
    <>
      <PageHeader
        eyebrow={'Service · ' + service.type}
        title={service.name}
        description={'One service, independently configured and released through ' + configRows.length + ' environment' + (configRows.length === 1 ? '' : 's') + '.'}
        actions={
          <div className="row">
            <Link className="button button-secondary" href={'/projects/' + slug + '/services/' + service.slug + '/revisions'}>Revisions</Link>
            {routes[0] ? (
              <a className="button button-secondary" href={(routes[0].route.tlsMode === 'none' ? 'http://' : 'https://') + routes[0].route.domain + routes[0].route.pathPrefix} target="_blank" rel="noreferrer">
                Open route <ArrowUpRight size={13} />
              </a>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="panel metric"><div className="metric-label">Type</div><div className="metric-value" style={{ fontSize: 22, textTransform: 'capitalize' }}>{service.type}</div><div className="metric-detail">Bower service model</div></div>
        <div className="panel metric"><div className="metric-label">Running allocations</div><div className="metric-value">{runningAllocations}</div><div className="metric-detail">Reported by Trellis</div></div>
        <div className="panel metric"><div className="metric-label">Routes</div><div className="metric-value">{routes.length}</div><div className="metric-detail">Managed ingress targets</div></div>
      </div>

      <div className="stack">
        {configRows.map(({ config, environment }, index) => {
          const job = jobs.get(environment.id)
          const allocations = job?.allocations || []
          const latest = deployments.find((deployment) => deployment.environmentId === environment.id)
          const sidecars = sidecarsByConfig.get(config.id) || []
          const nextEnvironment = configRows[index + 1]?.environment
          const secretOptions = projectSecrets.filter((row) => row.secret.environmentId === environment.id)

          return (
            <Panel
              key={environment.id}
              title={
                <span className="row">
                  {environment.name}
                  {environment.isLocked ? <Pill tone="warning">locked</Pill> : null}
                  {config.pausedReplicas ? <Pill tone="blue">paused</Pill> : null}
                  <StatusPill status={job?.status || latest?.status || 'not deployed'} />
                </span>
              }
              subtitle={environment.trellisNamespace + ' · ' + (config.activeJobName || service.slug)}
              action={canOperate ? (
                <div className="row">
                  <form action={deployServiceAction.bind(null, service.id, environment.id)}>
                    <button className="button button-primary button-sm" type="submit">Deploy</button>
                  </form>
                  <form action={restartServiceAction.bind(null, service.id, environment.id)}>
                    <button className="button button-secondary button-sm" type="submit"><RefreshCw size={12} />Restart</button>
                  </form>
                  {config.pausedReplicas ? (
                    <form action={resumeServiceAction.bind(null, service.id, environment.id)}>
                      <button className="button button-secondary button-sm" type="submit"><Play size={12} />Resume</button>
                    </form>
                  ) : (
                    <form action={scaleServiceAction.bind(null, service.id, environment.id, 0)}>
                      <button className="button button-secondary button-sm" type="submit"><Pause size={12} />Pause</button>
                    </form>
                  )}
                </div>
              ) : undefined}
            >
              <div className="grid grid-4">
                <div className="key-value"><div className="key-label">Image</div><div className="mono small truncate">{config.image}</div></div>
                <div className="key-value"><div className="key-label">Replicas</div><div>{config.replicas}</div></div>
                <div className="key-value"><div className="key-label">Resources</div><div>{config.cpu}m · {formatBytes(config.memory)}</div></div>
                <div className="key-value"><div className="key-label">Strategy</div><div>{config.deploymentStrategy.replaceAll('_', ' ')}</div></div>
              </div>

              {latest ? (
                <div className="callout" style={{ marginTop: 13 }}>
                  Latest deployment: <strong>{latest.imageAfter}</strong> · {latest.status.replaceAll('_', ' ')} · {formatDate(latest.createdAt)}
                </div>
              ) : null}

              {service.type === 'cron' ? (
                <div className="callout warning" style={{ marginTop: 13 }}>
                  Cron is modeled in Bower, but periodic execution depends on Trellis cron support. The schedule is preserved in configuration.
                </div>
              ) : null}

              {canOperate ? (
                <div className="row" style={{ marginTop: 13 }}>
                  <form action={scaleFromForm.bind(null, service.id, environment.id)} className="row">
                    <input className="input" name="replicas" type="number" min="0" defaultValue={config.replicas} aria-label={'Replicas in ' + environment.name} style={{ width: 76 }} />
                    <button className="button button-secondary button-sm" type="submit">Scale</button>
                  </form>
                  {latest?.previousJobSpec ? (
                    <form action={rollbackServiceAction.bind(null, service.id, environment.id)}>
                      <button className="button button-secondary button-sm" type="submit"><RotateCcw size={12} />Rollback</button>
                    </form>
                  ) : null}
                  {nextEnvironment ? (
                    <form action={promoteServiceAction.bind(null, service.id, environment.id, nextEnvironment.id)}>
                      <button className="button button-secondary button-sm" type="submit">Promote to {nextEnvironment.name}</button>
                    </form>
                  ) : null}
                </div>
              ) : null}

              <details className="disclosure" style={{ margin: '16px -18px -18px' }} open={allocations.length > 0}>
                <summary><span className="row"><Activity size={13} />Allocations · {allocations.length}</span></summary>
                <div className="disclosure-body">
                  {allocations.length ? (
                    <div className="table-wrap">
                      <table className="table">
                        <thead><tr><th>Allocation</th><th>Lifecycle</th><th>Health</th><th>Node</th><th>Attempt</th><th></th></tr></thead>
                        <tbody>
                          {allocations.map((allocation) => (
                            <tr key={allocation.id}>
                              <td><Link className="table-primary mono" href={'/projects/' + slug + '/services/' + service.slug + '/allocations/' + allocation.id}>{allocation.id.slice(0, 12)}</Link><div className="table-secondary">generation {allocation.generation}</div></td>
                              <td><StatusPill status={allocation.phase} /></td>
                              <td><StatusPill status={allocation.health} /></td>
                              <td className="mono small">{allocation.node_id.slice(0, 12)}</td>
                              <td>{allocation.attempt}</td>
                              <td>
                                <div className="row">
                                  <Link className="button button-secondary button-sm" href={'/projects/' + slug + '/services/' + service.slug + '/allocations/' + allocation.id}>Inspect</Link>
                                  {canOperate ? (
                                    <form action={stopAllocationAction.bind(null, service.id, allocation.id)}>
                                      <button className="button button-danger button-sm" type="submit">Stop</button>
                                    </form>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="muted small">No current allocations for this job.</div>}
                </div>
              </details>

              {canConfigure ? (
                <>
                  <details className="disclosure" style={{ margin: '0 -18px' }}>
                    <summary>Configuration</summary>
                    <div className="disclosure-body">
                      <form action={updateServiceConfigAction.bind(null, service.id, environment.id)} className="form-grid">
                        <div className="field form-span">
                          <label>Image</label>
                          <input className="input mono" name="image" defaultValue={config.image} required />
                        </div>
                        <div className="field">
                          <label>Replicas</label>
                          <input className="input" name="replicas" type="number" min="0" defaultValue={config.replicas} required />
                        </div>
                        <div className="field">
                          <label>Port</label>
                          <input className="input" name="port" type="number" min="1" max="65535" defaultValue={config.port || ''} />
                        </div>
                        <div className="field">
                          <label>Resource tier</label>
                          <select className="select" name="resourceTier" defaultValue={config.resourceTier}>
                            {['small', 'medium', 'large', 'xl', 'custom'].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>CPU · millicores</label>
                          <input className="input" name="cpu" type="number" min="1" defaultValue={config.cpu} />
                        </div>
                        <div className="field">
                          <label>Memory · MiB</label>
                          <input className="input" name="memory" type="number" min="1" defaultValue={Math.round(config.memory / 1048576)} />
                        </div>
                        <div className="field">
                          <label>Deployment strategy</label>
                          <select className="select" name="strategy" defaultValue={config.deploymentStrategy}>
                            <option value="rolling">Rolling</option>
                            <option value="recreate">Recreate</option>
                            <option value="blue_green">Blue-green</option>
                            <option value="canary">Canary</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Health check</label>
                          <select className="select" name="healthType" defaultValue={config.healthCheckType || ''}>
                            <option value="">None</option>
                            <option value="http">HTTP</option>
                            <option value="tcp">TCP</option>
                            <option value="script">Script</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Health path</label>
                          <input className="input mono" name="healthPath" defaultValue={config.healthCheckPath || ''} />
                        </div>
                        <div className="field">
                          <label>Health command</label>
                          <input className="input mono" name="healthCommand" defaultValue={Array.isArray(config.healthCheckCommand) ? config.healthCheckCommand.join(' ') : ''} />
                        </div>
                        <div className="field">
                          <label>Interval · seconds</label>
                          <input className="input" name="healthInterval" type="number" min="1" defaultValue={config.healthCheckInterval} />
                        </div>
                        <div className="field">
                          <label>Timeout · seconds</label>
                          <input className="input" name="healthTimeout" type="number" min="1" defaultValue={config.healthCheckTimeout} />
                        </div>
                        <div className="field">
                          <label>Failure threshold</label>
                          <input className="input" name="healthThreshold" type="number" min="1" defaultValue={config.healthCheckThreshold} />
                        </div>
                        <div className="field">
                          <label>Auto-rollback · seconds</label>
                          <input className="input" name="autoRollbackSeconds" type="number" min="30" defaultValue={config.autoRollbackSeconds} />
                        </div>
                        <div className="field">
                          <label>Command override</label>
                          <input className="input mono" name="command" defaultValue={config.command || ''} />
                        </div>
                        <div className="field">
                          <label>Cron schedule</label>
                          <input className="input mono" name="cronSchedule" defaultValue={config.cronSchedule || ''} placeholder="*/5 * * * *" />
                        </div>
                        <div className="field form-span">
                          <label>Environment variables</label>
                          <textarea className="textarea mono" name="envVars" defaultValue={lines(config.envVars)} />
                        </div>
                        <div className="field form-span">
                          <label>Labels</label>
                          <textarea className="textarea mono" name="labels" defaultValue={lines(config.labels)} />
                        </div>
                        <details className="form-span disclosure panel">
                          <summary>Advanced Trellis mapping</summary>
                          <div className="disclosure-body form-grid">
                            <div className="field form-span">
                              <label>Secret bindings · JSON</label>
                              <textarea className="textarea mono" name="secretBindings" defaultValue={json(config.secretBindings, [])} />
                              <span className="field-hint">Available here: {secretOptions.map((row) => row.secret.trellisSecretName).join(', ') || 'none'}</span>
                            </div>
                            <div className="field form-span">
                              <label>Volumes · JSON</label>
                              <textarea className="textarea mono" name="volumes" defaultValue={json(config.volumes, [])} />
                            </div>
                            <div className="field form-span">
                              <label>Canary steps · JSON</label>
                              <textarea className="textarea mono" name="canarySteps" defaultValue={json(config.canarySteps, [10, 25, 50, 100])} />
                            </div>
                            <div className="field form-span">
                              <label>Raw custom JobSpec · JSON</label>
                              <textarea className="textarea mono" name="rawConfig" defaultValue={config.rawConfig ? json(config.rawConfig, null) : ''} />
                            </div>
                          </div>
                        </details>
                        <div className="form-actions">
                          <button className="button button-primary" type="submit">Save configuration</button>
                        </div>
                      </form>
                    </div>
                  </details>

                  <details className="disclosure" style={{ margin: '0 -18px -18px' }}>
                    <summary>Sidecars · {sidecars.length}</summary>
                    <div className="disclosure-body stack">
                      {sidecars.length ? (
                        <div className="list panel">
                          {sidecars.map((sidecar) => (
                            <div className="list-row" key={sidecar.id}>
                              <div>
                                <div className="list-title">{sidecar.name}</div>
                                <div className="list-meta mono">{sidecar.image} · {sidecar.cpu}m · {formatBytes(sidecar.memory)}</div>
                              </div>
                              <form action={deleteSidecarAction.bind(null, service.id, sidecar.id)}>
                                <button className="button button-danger button-sm" type="submit"><Trash2 size={12} />Remove</button>
                              </form>
                            </div>
                          ))}
                        </div>
                      ) : <div className="muted small">No sidecars in this environment.</div>}
                      <form action={upsertSidecarAction.bind(null, service.id, environment.id)} className="form-grid">
                        <div className="field">
                          <label>Name</label>
                          <input className="input" name="name" placeholder="proxy" required />
                        </div>
                        <div className="field">
                          <label>Image</label>
                          <input className="input mono" name="image" placeholder="docker.io/…" required />
                        </div>
                        <div className="field">
                          <label>CPU · millicores</label>
                          <input className="input" name="cpu" type="number" defaultValue="100" />
                        </div>
                        <div className="field">
                          <label>Memory · MiB</label>
                          <input className="input" name="memory" type="number" defaultValue="128" />
                        </div>
                        <div className="field">
                          <label>Port</label>
                          <input className="input" name="port" type="number" />
                        </div>
                        <div className="field">
                          <label>Command</label>
                          <input className="input mono" name="command" />
                        </div>
                        <div className="field form-span">
                          <label>Environment variables</label>
                          <textarea className="textarea mono" name="envVars" />
                        </div>
                        <div className="form-actions">
                          <button className="button button-secondary" type="submit">Add sidecar</button>
                        </div>
                      </form>
                    </div>
                  </details>
                </>
              ) : null}
            </Panel>
          )
        })}
      </div>

      {canConfigure ? (
        <div style={{ marginTop: 16 }}>
          <Panel title="Delete service" subtitle="Removes Bower configuration and the related Trellis jobs in every environment." className="danger-zone">
            <form action={deleteService.bind(null, service.id, project.slug)} className="row-between">
              <span className="muted small">Deployment and audit records remain subject to database cascade rules.</span>
              <button className="button button-danger" type="submit"><Trash2 size={13} />Delete service</button>
            </form>
          </Panel>
        </div>
      ) : null}
    </>
  )
}
