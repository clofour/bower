'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { updateAccountAction, changePasswordAction, beginTotpAction, confirmTotpAction, disableTotpAction, createApiKeyAction, revokeApiKeyAction } from '@/lib/actions/settings'

export function AccountSettingsForm({
  userName,
  userEmail,
  totpEnabled,
  apiKeys,
}: {
  userName: string
  userEmail: string
  totpEnabled: boolean
  apiKeys: Array<{ id: string; name: string; keyPrefix: string; createdAt: Date; lastUsedAt: Date | null }>
}) {
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [totpError, setTotpError] = useState<string | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)

  function handleProfileSubmit(formData: FormData) {
    setProfileMsg(null)
    startProfileTransition(async () => {
      const result = await updateAccountAction(formData)
      if (result.error) {
        setProfileMsg({ type: 'error', text: result.error })
      } else if (result.success) {
        setProfileMsg({ type: 'success', text: 'Profile updated.' })
      }
    })
  }

  function handlePasswordSubmit(formData: FormData) {
    setPasswordMsg(null)
    startPasswordTransition(async () => {
      const result = await changePasswordAction(formData)
      if (result.error) {
        setPasswordMsg({ type: 'error', text: result.error })
      } else if (result.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed.' })
      }
    })
  }

  return (
    <div className="space-y-6">
      <form action={handleProfileSubmit}>
        <Card className="p-5">
          <h3 className="font-medium">Profile</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Name</Label>
              <Input id="account-name" name="name" defaultValue={userName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                name="email"
                type="email"
                defaultValue={userEmail}
              />
            </div>
          </div>
          {profileMsg && (
            <p
              className={`mt-3 text-sm ${profileMsg.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
            >
              {profileMsg.text}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isProfilePending}>
              {isProfilePending ? 'Saving...' : 'Update Profile'}
            </Button>
          </div>
        </Card>
      </form>

      <form action={handlePasswordSubmit}>
        <Card className="p-5">
          <h3 className="font-medium">Change Password</h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
          </div>
          {passwordMsg && (
            <p
              className={`mt-3 text-sm ${passwordMsg.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
            >
              {passwordMsg.text}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={isPasswordPending}>
              {isPasswordPending ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="p-5">
        <h3 className="font-medium">Two-Factor Authentication</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          TOTP-based two-factor authentication adds an extra layer of security.
        </p>
        <div className="mt-4">{totpEnabled ? <Button variant="outline" onClick={() => startProfileTransition(async () => { await disableTotpAction(); setTotpSecret(null) })}>Disable 2FA</Button> : totpSecret ? <div className="space-y-3"><div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Enter this key in your authenticator app</p><code className="mt-1 block break-all text-sm font-bold">{totpSecret}</code></div><form action={(data) => startProfileTransition(async () => { const result = await confirmTotpAction(String(data.get('code'))); setTotpError(result.error ?? null) })} className="flex gap-2"><Input name="code" inputMode="numeric" placeholder="000000" maxLength={6} /><Button>Verify</Button></form>{totpError && <p className="text-sm text-destructive">{totpError}</p>}</div> : <Button variant="outline" onClick={() => startProfileTransition(async () => { const result = await beginTotpAction(); if (result.secret) setTotpSecret(result.secret) })}>Set up authenticator</Button>}</div>
      </Card>

      <Card className="p-5"><h3 className="font-medium">API keys</h3><p className="mt-1 text-sm text-muted-foreground">Use personal keys for CI and deployment automation.</p><div className="mt-4 divide-y">{apiKeys.map((key) => <div key={key.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-medium">{key.name}</p><code className="text-xs text-muted-foreground">{key.keyPrefix}…</code></div><Button variant="ghost" size="sm" onClick={() => startProfileTransition(async () => revokeApiKeyAction(key.id))}>Revoke</Button></div>)}</div>{newKey && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"><p className="text-xs font-semibold">Copy this key now. It will not be shown again.</p><code className="mt-2 block break-all text-xs">{newKey}</code></div>}<form action={(data) => startProfileTransition(async () => { const result = await createApiKeyAction(String(data.get('name'))); if (result.token) setNewKey(result.token) })} className="mt-4 flex gap-2"><Input name="name" placeholder="Production deploys" /><Button variant="secondary">Create key</Button></form></Card>
    </div>
  )
}
