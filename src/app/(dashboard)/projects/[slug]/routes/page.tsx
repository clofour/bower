import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHeader, Panel, StatusPill } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { createRouteAction, deleteRouteAction, updateRouteAction } from '@/lib/actions/operations'
import { requireProject } from '@/lib/actions/shared'
import {
  getEnvironmentsByProject,
  getManagedProxies,
  getProjectBySlug,
  getRoutesByProject,
  getSecretsByProject,
  getServicesByProject,
  getUserOrganization,
} from '@/lib/queries'

function recordLines(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return Object.entries(value as Record<string, unknown>).map(([key, item]) => key + '=' + String(item)).join('\n')
}

function redirectLines(value: unknown) {
  if (!Array.isArray(value)) return ''
  return value.map((item) => {
    if (!item || typeof item !== 'object') return ''
    const row = item as { from?: string; to?: string; code?: number }
    return [row.from, row.to, row.code].filter((part) => part !== undefined).join(' ')
  }).filter(Boolean).join('\n')
}

export default async function RoutesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const access = await requireProject(project.id)
  const canEdit = access.projectRole === 'admin'

  const [routes, proxies, services, environments, secrets] = await Promise.all([
    getRoutesByProject(project.id),
    getManagedProxies(project.id),
    getServicesByProject(project.id),
    getEnvironmentsByProject(project.id),
    getSecretsByProject(project.id),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Managed ingress"
        title="Routes"
        description="Public HTTP/S entry points backed by Bower-managed Caddy proxies in each Trellis namespace."
      />

      {routes.length ? (
        <Panel title="Configured routes" subtitle="Bower owns proxy synchronization; DNS remains external.">
          <div className="stack">
            {routes.map((row) => (
              <div className="panel" key={row.route.id}>
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">
                      <span className="mono">{row.route.domain}{row.route.pathPrefix}</span>
                    </h3>
                    <div className="panel-subtitle">{row.environmentName} → {row.serviceName}:{row.route.port}</div>
                  </div>
                  <div className="row">
                    <span className="pill pill-blue">{row.route.tlsMode} TLS</span>
                    <a className="button button-secondary button-sm" href={(row.route.tlsMode === 'none' ? 'http://' : 'https://') + row.route.domain + row.route.pathPrefix} target="_blank" rel="noreferrer">
                      Open <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="grid grid-3">
                    <div className="key-value"><div className="key-label">Rate limit</div><div>{row.route.rateLimit ? row.route.rateLimit + ' req/s' : 'None'}</div></div>
                    <div className="key-value"><div className="key-label">Request headers</div><div>{Object.keys((row.route.headers || {}) as Record<string, unknown>).length}</div></div>
                    <div className="key-value"><div className="key-label">Redirect rules</div><div>{Array.isArray(row.route.redirects) ? row.route.redirects.length : 0}</div></div>
                  </div>
                  {canEdit ? (
                    <details className="disclosure" style={{ margin: '14px -18px -18px' }}>
                      <summary>Edit route</summary>
                      <div className="disclosure-body">
                        <form action={updateRouteAction.bind(null, project.id, row.route.id)} className="form-grid">
                          <div className="field">
                            <label>Domain</label>
                            <input className="input mono" name="domain" defaultValue={row.route.domain} required />
                          </div>
                          <div className="field">
                            <label>Path prefix</label>
                            <input className="input mono" name="pathPrefix" defaultValue={row.route.pathPrefix} />
                          </div>
                          <div className="field">
                            <label>Port</label>
                            <input className="input" name="port" type="number" min="1" max="65535" defaultValue={row.route.port} />
                          </div>
                          <div className="field">
                            <label>TLS</label>
                            <select className="select" name="tlsMode" defaultValue={row.route.tlsMode}>
                              <option value="auto">Automatic HTTPS</option>
                              <option value="custom">Custom certificate</option>
                              <option value="none">HTTP only</option>
                            </select>
                          </div>
                          <div className="field">
                            <label>TLS certificate secret</label>
                            <input className="input mono" name="tlsCertSecret" defaultValue={row.route.tlsCertSecret || ''} list="route-secret-names" />
                          </div>
                          <div className="field">
                            <label>TLS key secret</label>
                            <input className="input mono" name="tlsKeySecret" defaultValue={row.route.tlsKeySecret || ''} list="route-secret-names" />
                          </div>
                          <div className="field">
                            <label>Rate limit · req/s</label>
                            <input className="input" name="rateLimit" type="number" min="0" defaultValue={row.route.rateLimit || ''} />
                          </div>
                          <div className="field form-span">
                            <label>Request headers</label>
                            <textarea className="textarea mono" name="requestHeaders" defaultValue={recordLines(row.route.headers)} />
                          </div>
                          <div className="field form-span">
                            <label>Response headers</label>
                            <textarea className="textarea mono" name="responseHeaders" defaultValue={recordLines(row.route.responseHeaders)} />
                          </div>
                          <div className="field form-span">
                            <label>Redirects</label>
                            <textarea className="textarea mono" name="redirects" defaultValue={redirectLines(row.route.redirects)} placeholder="/old /new 308" />
                          </div>
                          <div className="form-actions">
                            <button className="button button-danger" type="submit" formAction={deleteRouteAction.bind(null, project.id, row.route.id)}><Trash2 size={13} />Delete route</button>
                            <button className="button button-primary" type="submit">Save route</button>
                          </div>
                        </form>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : (
        <Panel><div className="empty"><div className="empty-title">No routes configured</div><div>Services remain internal until a route is added.</div></div></Panel>
      )}

      <div style={{ height: 16 }} />

      <div className="grid grid-2">
        {canEdit ? (
          <Panel title={<span className="row"><Plus size={15} />Add route</span>} subtitle="Creates or updates the managed proxy for the selected environment.">
            <form action={createRouteAction.bind(null, project.id)} className="form-grid">
              <div className="field">
                <label>Domain</label>
                <input className="input mono" name="domain" placeholder="api.example.com" required />
              </div>
              <div className="field">
                <label>Path prefix</label>
                <input className="input mono" name="pathPrefix" defaultValue="/" />
              </div>
              <div className="field">
                <label>Service</label>
                <select className="select" name="serviceId" required defaultValue="">
                  <option value="" disabled>Select service</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Environment</label>
                <select className="select" name="environmentId" required defaultValue="">
                  <option value="" disabled>Select environment</option>
                  {environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Target port</label>
                <input className="input" name="port" type="number" min="1" max="65535" defaultValue="8080" />
              </div>
              <div className="field">
                <label>TLS</label>
                <select className="select" name="tlsMode" defaultValue="auto">
                  <option value="auto">Automatic HTTPS</option>
                  <option value="custom">Custom certificate</option>
                  <option value="none">HTTP only</option>
                </select>
              </div>
              <div className="field">
                <label>Certificate secret</label>
                <input className="input mono" name="tlsCertSecret" list="route-secret-names" />
              </div>
              <div className="field">
                <label>Key secret</label>
                <input className="input mono" name="tlsKeySecret" list="route-secret-names" />
              </div>
              <div className="field">
                <label>Rate limit · req/s</label>
                <input className="input" name="rateLimit" type="number" min="0" />
              </div>
              <div className="field form-span">
                <label>Request headers</label>
                <textarea className="textarea mono" name="requestHeaders" placeholder="X-Forwarded-Proto=https" />
              </div>
              <div className="field form-span">
                <label>Response headers</label>
                <textarea className="textarea mono" name="responseHeaders" />
              </div>
              <div className="field form-span">
                <label>Redirects</label>
                <textarea className="textarea mono" name="redirects" placeholder="/old /new 308" />
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit">Create route</button>
              </div>
            </form>
          </Panel>
        ) : null}

        <Panel title="Managed proxy state" subtitle="Infrastructure is shown separately from application services.">
          {proxies.length ? (
            <div className="list">
              {proxies.map((row) => (
                <div className="list-row" key={row.proxy.id}>
                  <div>
                    <div className="list-title">{row.environmentName}</div>
                    <div className="list-meta mono">{row.proxy.trellisJobName} · port {row.proxy.port}</div>
                  </div>
                  <StatusPill status={row.proxy.status} />
                </div>
              ))}
            </div>
          ) : <div className="empty"><div className="empty-title">No proxy jobs</div><div>A proxy is provisioned lazily when ingress is needed.</div></div>}
        </Panel>
      </div>

      <datalist id="route-secret-names">
        {secrets.map((row) => <option key={row.secret.id} value={row.secret.trellisSecretName}>{row.environmentName}</option>)}
      </datalist>
    </>
  )
}
