import { Plus, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { WebhookCreator } from '@/components/webhook-creator'
import { PageHeader, Panel, Pill, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import {
  createNotificationChannelAction,
  deleteNotificationChannelAction,
  deleteWebhookAction,
} from '@/lib/actions/integrations'
import { requireProject } from '@/lib/actions/shared'
import {
  getEnvironmentsByProject,
  getProjectBySlug,
  getProjectIntegrations,
  getServicesByProject,
  getUserOrganization,
} from '@/lib/queries'

export default async function IntegrationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const access = await requireProject(project.id)
  const canEdit = access.projectRole === 'admin'

  const [{ hooks, channels }, services, environments] = await Promise.all([
    getProjectIntegrations(project.id),
    getServicesByProject(project.id),
    getEnvironmentsByProject(project.id),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Automation"
        title="Integrations"
        description="Trigger deployments from registries or CI, then send release events to the systems your team already watches."
      />

      <div className="grid grid-2">
        <Panel title="Inbound deployment hooks" subtitle="Tokens also act as HMAC-SHA256 signing secrets.">
          {hooks.length ? (
            <div className="list">
              {hooks.map((row) => (
                <div className="list-row" key={row.hook.id}>
                  <div className="list-main">
                    <div className="list-title">{row.serviceName} → {row.environmentName}</div>
                    <div className="list-meta">{row.hook.provider.replaceAll('_', ' ')} · {row.hook.deployMode.replaceAll('_', ' ')} · token {row.hook.tokenPrefix}… · {formatDate(row.hook.createdAt)}</div>
                    {row.hook.tagFilter ? <div className="list-meta mono">{row.hook.tagFilter}</div> : null}
                  </div>
                  <div className="list-actions">
                    <Pill tone={row.hook.isActive ? 'success' : 'default'}>{row.hook.isActive ? 'active' : 'inactive'}</Pill>
                    {canEdit ? (
                      <form action={deleteWebhookAction.bind(null, project.id, row.hook.id)}>
                        <button className="button button-danger button-sm" type="submit"><Trash2 size={12} /></button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty"><div className="empty-title">No inbound hooks</div><div>Create one to let CI or a registry initiate deployments.</div></div>}

          {canEdit ? (
            <details className="disclosure" style={{ margin: '12px -18px -18px' }}>
              <summary><span className="row"><Plus size={13} />Create endpoint</span></summary>
              <div className="disclosure-body">
                <WebhookCreator projectId={project.id} services={services} environments={environments} />
              </div>
            </details>
          ) : null}
        </Panel>

        <Panel title="Outbound notifications" subtitle="Deployment events delivered over HTTPS.">
          {channels.length ? (
            <div className="list">
              {channels.map((channel) => (
                <div className="list-row" key={channel.id}>
                  <div className="list-main">
                    <div className="list-title">{channel.name}</div>
                    <div className="list-meta">{channel.type} · {channel.isActive ? 'active' : 'inactive'} · {formatDate(channel.createdAt)}</div>
                  </div>
                  {canEdit ? (
                    <form action={deleteNotificationChannelAction.bind(null, project.id, channel.id)}>
                      <button className="button button-danger button-sm" type="submit"><Trash2 size={12} /></button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="empty"><div className="empty-title">No notification channels</div><div>Add Slack, Discord, or a generic HTTP destination.</div></div>}

          {canEdit ? (
            <details className="disclosure" style={{ margin: '12px -18px -18px' }}>
              <summary><span className="row"><Plus size={13} />Add channel</span></summary>
              <div className="disclosure-body">
                <form action={createNotificationChannelAction.bind(null, project.id)} className="form-grid">
                  <div className="field">
                    <label>Name</label>
                    <input className="input" name="name" placeholder="Release room" required />
                  </div>
                  <div className="field">
                    <label>Type</label>
                    <select className="select" name="type" defaultValue="http">
                      <option value="slack">Slack</option>
                      <option value="discord">Discord</option>
                      <option value="http">Generic HTTP</option>
                    </select>
                  </div>
                  <div className="field form-span">
                    <label>HTTPS endpoint</label>
                    <input className="input mono" name="url" type="url" placeholder="https://…" required />
                  </div>
                  <div className="form-actions">
                    <button className="button button-primary" type="submit">Add channel</button>
                  </div>
                </form>
              </div>
            </details>
          ) : null}
        </Panel>
      </div>
    </>
  )
}
