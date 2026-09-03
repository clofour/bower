'use client'

import { useActionState } from 'react'
import { createWebhookAction, type WebhookCreationState } from '@/lib/actions/integrations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateWebhookForm({ projectId, services, environments }: { projectId: string; services: Array<{ id: string; name: string }>; environments: Array<{ id: string; name: string }> }) {
  const action = createWebhookAction.bind(null, projectId)
  const [state, formAction, pending] = useActionState(action, {} as WebhookCreationState)
  if (state.token) return <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Copy this once</p><p className="mt-2 break-all font-mono text-xs">{location.origin}/api/webhooks/{state.token}</p><p className="mt-2 text-xs text-muted-foreground">Use the same token as the HMAC-SHA256 signing secret.</p></div>
  return <form action={formAction} className="space-y-3"><div className="grid grid-cols-2 gap-2"><select name="serviceId" required className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">Service</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select name="environmentId" required className="h-9 rounded-md border bg-background px-2 text-sm"><option value="">Environment</option>{environments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="grid grid-cols-2 gap-2"><select name="provider" className="h-9 rounded-md border bg-background px-2 text-sm"><option value="generic">Generic</option><option value="docker_hub">Docker Hub</option><option value="ghcr">GHCR</option></select><select name="deployMode" className="h-9 rounded-md border bg-background px-2 text-sm"><option value="any_push">Any push</option><option value="tag">Matching tag</option><option value="digest">Digest only</option></select></div><Input name="tagFilter" placeholder="Optional tag regex, e.g. ^v\\d+" />{state.error && <p className="text-sm text-destructive">{state.error}</p>}<Button disabled={pending} className="w-full">{pending ? 'Creating…' : 'Create endpoint'}</Button></form>
}
