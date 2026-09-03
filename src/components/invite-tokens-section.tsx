'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createInviteTokenAction, revokeInviteTokenAction } from '@/lib/actions/settings'

type Role = 'owner' | 'admin' | 'member'

type TokenRow = {
  token: {
    id: string
    tokenPrefix: string
    role: Role
    note: string | null
    usedAt: Date | null
    expiresAt: Date | null
    createdAt: Date
  }
  createdByName: string | null
}

export function InviteTokensSection({
  tokens,
  canEdit,
  currentRole,
}: {
  tokens: TokenRow[]
  canEdit: boolean
  currentRole: Role
}) {
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('member')
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const [revokeErrors, setRevokeErrors] = useState<Record<string, string>>({})

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setNewToken(null)
    startTransition(async () => {
      const result = await createInviteTokenAction(role, note)
      if (result.error) {
        setCreateError(result.error)
      } else if (result.token) {
        setNewToken(result.token)
        setNote('')
      }
    })
  }

  function handleRevoke(id: string) {
    setRevokeErrors((prev) => ({ ...prev, [id]: '' }))
    startTransition(async () => {
      const result = await revokeInviteTokenAction(id)
      if (result?.error) {
        setRevokeErrors((prev) => ({ ...prev, [id]: result.error! }))
      }
    })
  }

  async function handleCopy() {
    if (!newToken) return
    await navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleOptions: Role[] = currentRole === 'owner' ? ['owner', 'admin', 'member'] : ['admin', 'member']

  return (
    <Card className="p-5">
      <h3 className="font-medium">Invite Tokens</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Single-use tokens that allow new users to create an account.
      </p>

      {newToken && (
        <div className="mt-4 rounded-md border border-green-500/30 bg-green-500/5 p-3.5">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Token created — copy it now, it won&apos;t be shown again.
          </p>
          <div className="mt-2 flex gap-2">
            <Input
              readOnly
              value={newToken}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-note" className="text-xs">Label (optional)</Label>
              <Input
                id="invite-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. For Alice"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-role" className="text-xs">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {createError && (
            <p className="text-xs text-destructive">{createError}</p>
          )}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create invite token'}
          </Button>
        </form>
      )}

      {tokens.length > 0 && (
        <div className="mt-4 divide-y divide-border">
          {tokens.map(({ token, createdByName }) => (
            <div key={token.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{token.tokenPrefix}…</span>
                  <Badge variant="outline" className="capitalize text-xs">{token.role}</Badge>
                  {token.usedAt ? (
                    <Badge variant="secondary" className="text-xs">Used</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-500/40">Active</Badge>
                  )}
                </div>
                {token.note && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{token.note}</p>
                )}
                {createdByName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Created by {createdByName}
                  </p>
                )}
                {!createdByName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Bootstrap token</p>
                )}
              </div>
              {canEdit && !token.usedAt && (
                <div className="ml-4 shrink-0">
                  {revokeErrors[token.id] && (
                    <p className="mb-1 text-xs text-destructive">{revokeErrors[token.id]}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    disabled={isPending}
                    onClick={() => handleRevoke(token.id)}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tokens.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">No invite tokens yet.</p>
      )}
    </Card>
  )
}
