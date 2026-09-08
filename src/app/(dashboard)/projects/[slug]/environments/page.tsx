import { Lock, LockOpen, Plus, Trash2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHeader, Panel, Pill, formatDate } from '@/components/primitives'
import { getCurrentUser } from '@/lib/auth'
import {
  createEnvironmentAction,
  deleteEnvironmentAction,
  toggleEnvironmentLockAction,
  updateEnvironmentAction,
} from '@/lib/actions/operations'
import { requireProject } from '@/lib/actions/shared'
import { getEnvironmentsByProject, getProjectBySlug, getUserOrganization } from '@/lib/queries'

function envLines(value: unknown) {
  if (!value || typeof value !== 'object') return ''
  return Object.keys(value as Record<string, unknown>).map((key) => key + '=').join('\n')
}

export default async function EnvironmentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const user = await getCurrentUser()
  if (!user) notFound()
  const context = await getUserOrganization(user.id)
  if (!context) notFound()
  const project = await getProjectBySlug(context.org.id, slug)
  if (!project) notFound()
  const access = await requireProject(project.id)
  const environments = await getEnvironmentsByProject(project.id)
  const canEdit = access.projectRole === 'admin'

  return (
    <>
      <PageHeader
        eyebrow="Release topology"
        title="Environments"
        description="Ordered promotion stages with independent defaults, Trellis namespaces, environment variables, and deployment locks."
      />

      <div className="grid grid-2">
        {environments.map((environment) => (
          <Panel
            key={environment.id}
            title={<span className="row">{environment.name}{environment.isLocked ? <Pill tone="warning">locked</Pill> : null}</span>}
            subtitle={environment.trellisNamespace}
            action={canEdit ? (
              <form action={toggleEnvironmentLockAction.bind(null, project.id, environment.id, !environment.isLocked)}>
                <button className="button button-secondary button-sm" type="submit">
                  {environment.isLocked ? <LockOpen size={13} /> : <Lock size={13} />}
                  {environment.isLocked ? 'Unlock' : 'Lock'}
                </button>
              </form>
            ) : undefined}
          >
            <div className="key-value"><div className="key-label">Promotion order</div><div>{environment.promotionOrder}</div></div>
            <div className="key-value"><div className="key-label">Default replicas</div><div>{environment.defaultReplicas}</div></div>
            <div className="key-value"><div className="key-label">Resource tier</div><div>{environment.resourceTier}</div></div>
            <div className="key-value"><div className="key-label">Variables</div><div>{Object.keys((environment.envVars || {}) as Record<string, unknown>).length} secret-backed key{Object.keys((environment.envVars || {}) as Record<string, unknown>).length === 1 ? '' : 's'}</div></div>
            <div className="key-value"><div className="key-label">Updated</div><div>{formatDate(environment.updatedAt)}</div></div>

            {canEdit ? (
              <details className="disclosure" style={{ margin: '14px -18px -18px' }}>
                <summary>Edit environment</summary>
                <div className="disclosure-body">
                  <form action={updateEnvironmentAction.bind(null, project.id, environment.id)} className="form-grid">
                    <div className="field">
                      <label>Promotion order</label>
                      <input className="input" name="promotionOrder" type="number" min="0" defaultValue={environment.promotionOrder} />
                    </div>
                    <div className="field">
                      <label>Default replicas</label>
                      <input className="input" name="replicas" type="number" min="0" defaultValue={environment.defaultReplicas} />
                    </div>
                    <div className="field">
                      <label>Resource tier</label>
                      <select className="select" name="resourceTier" defaultValue={environment.resourceTier}>
                        {['small', 'medium', 'large', 'xl', 'custom'].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                      </select>
                    </div>
                    <div className="field form-span">
                      <label>Environment variables</label>
                      <textarea className="textarea mono" name="envVars" defaultValue={envLines(environment.envVars)} placeholder={'API_URL=https://example.com\nFEATURE_FLAG=true'} />
                      <span className="field-hint">Enter KEY=value. Existing values are not retrievable; leave the value blank to preserve an existing key.</span>
                    </div>
                    <div className="form-actions">
                      <button className="button button-primary" type="submit">Save environment</button>
                    </div>
                  </form>
                </div>
              </details>
            ) : null}
          </Panel>
        ))}

        {canEdit ? (
          <Panel title={<span className="row"><Plus size={15} />Add environment</span>} subtitle="Appends a new promotion stage.">
            <form action={createEnvironmentAction.bind(null, project.id)} className="form-grid">
              <div className="field">
                <label>Name</label>
                <input className="input" name="name" placeholder="QA" required />
              </div>
              <div className="field">
                <label>Default replicas</label>
                <input className="input" name="replicas" type="number" min="0" defaultValue="1" />
              </div>
              <div className="field">
                <label>Resource tier</label>
                <select className="select" name="resourceTier" defaultValue="small">
                  {['small', 'medium', 'large', 'xl', 'custom'].map((tier) => <option key={tier} value={tier}>{tier}</option>)}
                </select>
              </div>
              <div className="field form-span">
                <label>Environment variables</label>
                <textarea className="textarea mono" name="envVars" placeholder={'API_URL=https://qa.example.com'} />
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit"><Plus size={13} />Create environment</button>
              </div>
            </form>
          </Panel>
        ) : null}
      </div>

      {canEdit && environments.length ? (
        <Panel title="Environment removal" subtitle="Bower only permits removal after project services have been deleted." className="danger-zone" >
          <div className="list">
            {environments.map((environment) => (
              <div className="list-row" key={environment.id}>
                <div>
                  <div className="list-title">{environment.name}</div>
                  <div className="list-meta mono">{environment.trellisNamespace}</div>
                </div>
                <form action={deleteEnvironmentAction.bind(null, project.id, environment.id)}>
                  <button className="button button-danger button-sm" type="submit"><Trash2 size={13} />Delete</button>
                </form>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </>
  )
}
