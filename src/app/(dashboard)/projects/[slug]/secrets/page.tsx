import { KeyRound, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHeader, Panel, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import { deleteSecretAction, setSecretAction } from '@/lib/actions/operations'
import { requireProject } from '@/lib/actions/shared'
import { getEnvironmentsByProject, getProjectBySlug, getSecretsByProject, getUserOrganization } from '@/lib/queries'

export default async function SecretsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const access = await requireProject(project.id)
  const canEdit = access.projectRole === 'admin'
  const [secrets, environments] = await Promise.all([
    getSecretsByProject(project.id),
    getEnvironmentsByProject(project.id),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Sensitive configuration"
        title="Secrets"
        description="Bower tracks names, consumers, and rotation metadata. Secret values live only in Trellis and are never read back."
      />

      <div className="grid grid-2">
        <Panel title="Secret inventory" subtitle={secrets.length + ' metadata entr' + (secrets.length === 1 ? 'y' : 'ies')}>
          {secrets.length ? (
            <div className="list">
              {secrets.map((row) => (
                <div className="list-row" key={row.secret.id}>
                  <div className="list-main">
                    <div className="list-title mono">{row.secret.name}</div>
                    <div className="list-meta">
                      {row.environmentName}
                      {row.sharedName ? ' · shared as ' + row.sharedName : ''}
                      {' · rotated ' + formatDate(row.secret.lastRotatedAt)}
                    </div>
                  </div>
                  {canEdit ? (
                    <form action={deleteSecretAction.bind(null, project.id, row.secret.id)}>
                      <button className="button button-danger button-sm" type="submit" title="Delete secret"><Trash2 size={13} />Delete</button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          ) : <div className="empty"><div className="empty-title">No secrets</div><div>Add a value for an environment, then reference it from a service.</div></div>}
        </Panel>

        {canEdit ? (
          <Panel title={<span className="row"><KeyRound size={15} />Create or rotate</span>} subtitle="Writing an existing name rotates its value.">
            <form action={setSecretAction.bind(null, project.id)} className="form-grid">
              <div className="field">
                <label>Environment</label>
                <select className="select" name="environmentId" required defaultValue="">
                  <option value="" disabled>Select environment</option>
                  {environments.map((environment) => <option key={environment.id} value={environment.id}>{environment.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Name</label>
                <input className="input mono" name="name" placeholder="DATABASE_URL" required />
              </div>
              <div className="field form-span">
                <label>Value</label>
                <input className="input mono" name="value" type="password" autoComplete="new-password" required />
                <span className="field-hint">Sent directly to Trellis. Bower stores metadata only.</span>
              </div>
              <div className="field form-span">
                <label>Shared logical name</label>
                <input className="input mono" name="sharedName" placeholder="DATABASE_URL" />
                <span className="field-hint">Optional: group equivalent secrets across staging, production, and other environments.</span>
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit">Store secret</button>
              </div>
            </form>
          </Panel>
        ) : null}
      </div>

      <div className="callout" style={{ marginTop: 16 }}>
        Deletion is blocked while a service binding or custom-TLS route still references the secret.
      </div>
    </>
  )
}
