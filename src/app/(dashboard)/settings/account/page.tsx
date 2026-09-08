import { KeyRound, Trash2 } from 'lucide-react'
import { PageHeader, Panel, formatDate } from '@/components/primitives'
import { ApiKeyCreator } from '@/components/credential-creators'
import { getCurrentUser } from '@/lib/auth'
import { changePasswordAction, revokeApiKeyAction, updateAccountAction } from '@/lib/actions/settings'
import { getApiKeys } from '@/lib/queries'

async function updateAccount(formData: FormData) {
  'use server'
  await updateAccountAction(formData)
}

async function changePassword(formData: FormData) {
  'use server'
  await changePasswordAction(formData)
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) return null
  const keys = await getApiKeys(user.id)

  return (
    <>
      <PageHeader
        eyebrow="Personal settings"
        title="Account"
        description="Your Bower identity and automation credentials."
      />

      <div className="grid grid-2">
        <Panel title="Profile" subtitle="Used in deployment history and audit records.">
          <form action={updateAccount} className="form-grid">
            <div className="field">
              <label>Name</label>
              <input className="input" name="name" defaultValue={user.name} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" name="email" type="email" defaultValue={user.email} required />
            </div>
            <div className="form-actions">
              <button className="button button-primary" type="submit">Save profile</button>
            </div>
          </form>
        </Panel>

        <Panel title="Password" subtitle="Changing it does not revoke existing sessions.">
          <form action={changePassword} className="form-grid">
            <div className="field form-span">
              <label>Current password</label>
              <input className="input" name="currentPassword" type="password" autoComplete="current-password" required />
            </div>
            <div className="field form-span">
              <label>New password</label>
              <input className="input" name="newPassword" type="password" minLength={8} autoComplete="new-password" required />
            </div>
            <div className="form-actions">
              <button className="button button-secondary" type="submit">Change password</button>
            </div>
          </form>
        </Panel>
      </div>

      <div style={{ height: 16 }} />

      <Panel title={<span className="row"><KeyRound size={15} />API keys</span>} subtitle="For CI and the deploy API. Full tokens are shown only once.">
        <ApiKeyCreator />
        <div className="separator" />
        {keys.length ? (
          <div className="list">
            {keys.map((key) => (
              <div className="list-row" key={key.id}>
                <div>
                  <div className="list-title">{key.name}</div>
                  <div className="list-meta mono">{key.keyPrefix}… · created {formatDate(key.createdAt)}{key.lastUsedAt ? ' · last used ' + formatDate(key.lastUsedAt) : ' · never used'}</div>
                </div>
                <form action={revokeApiKeyAction.bind(null, key.id)}>
                  <button className="button button-danger button-sm" type="submit"><Trash2 size={12} />Revoke</button>
                </form>
              </div>
            ))}
          </div>
        ) : <div className="muted small">No API keys yet.</div>}
      </Panel>
    </>
  )
}
