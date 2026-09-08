import { ShieldCheck, Trash2 } from 'lucide-react'
import { PageHeader, Panel, Pill, formatDate } from '@/components/primitives'
import { InviteTokenCreator } from '@/components/credential-creators'
import { requireContext } from '@/lib/actions/shared'
import { addOrganizationMemberAction } from '@/lib/actions/operations'
import { revokeInviteTokenAction, updateOrganizationAction } from '@/lib/actions/settings'
import { getOrgMembers, getOrganizationTokens } from '@/lib/queries'

async function updateOrganization(formData: FormData) {
  'use server'
  await updateOrganizationAction(formData)
}

export default async function OrganizationPage() {
  const context = await requireContext()
  const [members, tokens] = await Promise.all([
    getOrgMembers(context.org.id),
    getOrganizationTokens(context.org.id),
  ])
  const canAdmin = context.role !== 'member'

  return (
    <>
      <PageHeader
        eyebrow="Organization"
        title={context.org.name}
        description="Bower instance identity, Trellis control-plane connection, and organization-wide membership."
      />

      <div className="grid grid-2">
        <Panel title="General" subtitle="The Trellis operator credential is write-only in this UI after saving.">
          {canAdmin ? (
            <form action={updateOrganization} className="form-grid">
              <div className="field form-span">
                <label>Organization name</label>
                <input className="input" name="name" defaultValue={context.org.name} required />
              </div>
              <div className="field form-span">
                <label>Trellis API URL</label>
                <input className="input mono" name="trellisApiUrl" type="url" defaultValue={context.org.trellisApiUrl} placeholder="https://trellis.example.com:8128" />
              </div>
              <div className="field form-span">
                <label>Replace Trellis operator token</label>
                <input className="input mono" name="trellisApiToken" type="password" autoComplete="new-password" placeholder="Leave blank to keep the current token" />
              </div>
              <div className="form-actions">
                <button className="button button-primary" type="submit">Save organization</button>
              </div>
            </form>
          ) : (
            <div>
              <div className="key-value"><div className="key-label">Name</div><div>{context.org.name}</div></div>
              <div className="key-value"><div className="key-label">Trellis API</div><div className="mono small">{context.org.trellisApiUrl}</div></div>
            </div>
          )}
        </Panel>

        <Panel title="Members" subtitle="Organization roles set the ceiling for project access.">
          {members.length ? (
            <div className="list">
              {members.map((row) => (
                <div className="list-row" key={row.membership.id}>
                  <div>
                    <div className="list-title">{row.userName}</div>
                    <div className="list-meta">{row.userEmail}</div>
                  </div>
                  <Pill tone={row.membership.role === 'owner' ? 'accent' : 'default'}>{row.membership.role}</Pill>
                </div>
              ))}
            </div>
          ) : null}
          {context.role === 'owner' ? (
            <details className="disclosure" style={{ margin: '12px -18px -18px' }}>
              <summary>Add or change a member</summary>
              <div className="disclosure-body">
                <form action={addOrganizationMemberAction} className="form-grid">
                  <div className="field">
                    <label>Registered email</label>
                    <input className="input" name="email" type="email" required />
                  </div>
                  <div className="field">
                    <label>Role</label>
                    <select className="select" name="role" defaultValue="member">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button className="button button-secondary" type="submit">Save member</button>
                  </div>
                </form>
              </div>
            </details>
          ) : null}
        </Panel>
      </div>

      {canAdmin ? (
        <div style={{ marginTop: 16 }}>
          <Panel title={<span className="row"><ShieldCheck size={15} />Invite tokens</span>} subtitle="Single-use credentials for account registration.">
            <InviteTokenCreator />
            <div className="separator" />
            {tokens.length ? (
              <div className="list">
                {tokens.map((row) => (
                  <div className="list-row" key={row.token.id}>
                    <div>
                      <div className="list-title mono">{row.token.tokenPrefix}… <span className="muted">· {row.token.role}</span></div>
                      <div className="list-meta">
                        {row.token.note || 'No note'} · created {formatDate(row.token.createdAt)}
                        {row.token.usedAt ? ' · used ' + formatDate(row.token.usedAt) : ' · unused'}
                      </div>
                    </div>
                    <div className="list-actions">
                      <Pill tone={row.token.usedAt ? 'default' : 'success'}>{row.token.usedAt ? 'used' : 'ready'}</Pill>
                      {!row.token.usedAt ? (
                        <form action={revokeInviteTokenAction.bind(null, row.token.id)}>
                          <button className="button button-danger button-sm" type="submit"><Trash2 size={12} />Revoke</button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="muted small">No invite tokens have been created.</div>}
          </Panel>
        </div>
      ) : null}
    </>
  )
}
