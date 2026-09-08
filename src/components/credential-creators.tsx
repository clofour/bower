'use client'

import { useActionState } from 'react'
import { createApiKeyAction, createInviteTokenAction } from '@/lib/actions/settings'

type ApiState = { token?: string; error?: string }
type InviteState = { token?: string; error?: string }

export function ApiKeyCreator() {
  const [state, action, pending] = useActionState<ApiState, FormData>(
    async (_previous, formData) => createApiKeyAction(String(formData.get('name') ?? '')),
    {},
  )
  return (
    <div className="stack">
      <form action={action} className="row">
        <input className="input" name="name" placeholder="Key name, e.g. GitHub Actions" required style={{ maxWidth: 280 }} />
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create key'}</button>
      </form>
      {state.error ? <div className="callout danger">{state.error}</div> : null}
      {state.token ? (
        <div className="callout">
          <div className="strong" style={{ marginBottom: 6 }}>Copy this key now. It will not be shown again.</div>
          <div className="token-box">{state.token}</div>
        </div>
      ) : null}
    </div>
  )
}

export function InviteTokenCreator() {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    async (_previous, formData) => createInviteTokenAction(
      String(formData.get('role') ?? 'member') as 'owner' | 'admin' | 'member',
      String(formData.get('note') ?? ''),
    ),
    {},
  )
  return (
    <div className="stack">
      <form action={action} className="form-grid">
        <div className="field">
          <label htmlFor="invite-role">Organization role</label>
          <select id="invite-role" className="select" name="role" defaultValue="member">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="invite-note">Note</label>
          <input id="invite-note" className="input" name="note" placeholder="Who this token is for" />
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create invite token'}</button>
        </div>
      </form>
      {state.error ? <div className="callout danger">{state.error}</div> : null}
      {state.token ? (
        <div className="callout">
          <div className="strong" style={{ marginBottom: 6 }}>Share this token once. It is consumed at registration.</div>
          <div className="token-box">{state.token}</div>
        </div>
      ) : null}
    </div>
  )
}
