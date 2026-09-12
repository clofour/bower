'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createInviteTokenAction, revokeInviteTokenAction } from '@/lib/actions/settings'

interface TokenRow {
  token: {
    id: string
    tokenPrefix: string
    role: string
    note: string | null
    usedAt: string | null
    expiresAt: string | null
    createdAt: string
  }
  createdByName: string | null
}

interface InviteTokensSectionProps {
  tokens: TokenRow[]
  role: string
}

function tokenStatus(token: TokenRow['token']): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' } {
  if (token.usedAt) return { label: 'Used', variant: 'secondary' }
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) return { label: 'Expired', variant: 'destructive' }
  return { label: 'Active', variant: 'success' }
}

export function InviteTokensSection({ tokens, role }: InviteTokensSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('member')

  const isAdmin = role === 'owner' || role === 'admin'

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const tokenRole = selectedRole as 'owner' | 'admin' | 'member'
    const note = formData.get('note') as string | undefined
    const result = await createInviteTokenAction(tokenRole, note || undefined)
    if (result?.error) {
      setError(result.error)
    } else if (result?.token) {
      setCreatedToken(result.token)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRevoke(tokenId: string) {
    setRevoking(tokenId)
    await revokeInviteTokenAction(tokenId)
    router.refresh()
    setRevoking(null)
  }

  function handleClose() {
    setOpen(false)
    setCreatedToken(null)
    setError(null)
    setSelectedRole('member')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Invite Tokens</h3>
          <p className="text-sm text-ink-muted">
            Generate tokens to invite new members to the organization.
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Token</DialogTitle>
                <DialogDescription>
                  Generate a one-time token to invite a new member.
                </DialogDescription>
              </DialogHeader>
              {createdToken ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Token created successfully. Copy it now -- it will not be shown again.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-sunken px-3 py-2 text-sm font-mono break-all">
                      {createdToken}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(createdToken)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleClose}>Done</Button>
                  </DialogFooter>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {role === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note (optional)</Label>
                    <Input id="note" name="note" placeholder="e.g. For new hire Jane" />
                  </div>
                  {error && <p className="text-sm text-danger-600">{error}</p>}
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Token'}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tokens.length === 0 ? (
        <p className="text-sm text-ink-muted py-4">No invite tokens have been created.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prefix</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created</TableHead>
              {isAdmin && <TableHead className="w-[70px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((row) => {
              const status = tokenStatus(row.token)
              return (
                <TableRow key={row.token.id}>
                  <TableCell className="font-mono text-xs">{row.token.tokenPrefix}...</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.token.role}</Badge>
                  </TableCell>
                  <TableCell className="text-ink-muted">{row.token.note || '--'}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{row.createdByName || '--'}</TableCell>
                  <TableCell className="text-ink-muted text-xs">
                    {new Date(row.token.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {!row.token.usedAt && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevoke(row.token.id)}
                          disabled={revoking === row.token.id}
                        >
                          <Trash2 className="h-4 w-4 text-danger-600" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
