'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { updateAccountAction, changePasswordAction } from '@/lib/actions/settings'

export function AccountSettingsForm({
  userName,
  userEmail,
}: {
  userName: string
  userEmail: string
}) {
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isProfilePending, startProfileTransition] = useTransition()
  const [isPasswordPending, startPasswordTransition] = useTransition()

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
        <div className="mt-4">
          <Button variant="outline" disabled>
            Not yet available
          </Button>
        </div>
      </Card>
    </div>
  )
}
