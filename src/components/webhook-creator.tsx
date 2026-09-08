'use client'

import { useActionState } from 'react'
import { createWebhookAction } from '@/lib/actions/integrations'

type State = { token?: string; error?: string }

export function WebhookCreator({
  projectId,
  services,
  environments,
}: {
  projectId: string
  services: Array<{ id: string; name: string }>
  environments: Array<{ id: string; name: string }>
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    createWebhookAction.bind(null, projectId),
    {},
  )

  return (
    <div className="stack">
      <form action={action} className="form-grid">
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
          <label>Provider</label>
          <select className="select" name="provider" defaultValue="generic">
            <option value="generic">Generic</option>
            <option value="ghcr">GHCR</option>
            <option value="docker_hub">Docker Hub</option>
          </select>
        </div>
        <div className="field">
          <label>Deploy trigger</label>
          <select className="select" name="deployMode" defaultValue="any_push">
            <option value="any_push">Any push</option>
            <option value="tag">Matching tag</option>
            <option value="digest">Digest</option>
          </select>
        </div>
        <div className="field form-span">
          <label>Tag filter</label>
          <input className="input mono" name="tagFilter" placeholder="^v\d+\.\d+\.\d+$" />
          <span className="field-hint">Optional regular expression; used for tag-triggered hooks.</span>
        </div>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create endpoint'}</button>
        </div>
      </form>
      {state.error ? <div className="callout danger">{state.error}</div> : null}
      {state.token ? (
        <div className="callout">
          <div className="strong" style={{ marginBottom: 6 }}>Endpoint token / HMAC secret — copy it now.</div>
          <div className="token-box">{state.token}</div>
          <div className="small" style={{ marginTop: 7 }}>Webhook path: <span className="mono">/api/webhooks/{state.token}</span></div>
        </div>
      ) : null}
    </div>
  )
}
