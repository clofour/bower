'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { updateOrganizationAction } from '@/lib/actions/settings'

export function OrgSettingsForm({
  orgName,
  trellisApiUrl,
  hasTrellisToken,
  canEdit,
}: {
  orgName: string
  trellisApiUrl: string
  hasTrellisToken: boolean
  canEdit: boolean
}) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateOrganizationAction(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved.' })
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <Card className="p-5">
        <h3 className="font-medium">General</h3>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              name="name"
              defaultValue={orgName}
              disabled={!canEdit}
            />
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h3 className="font-medium">Trellis Connection</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Bower to your Trellis cluster API.
        </p>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trellis-url">API URL</Label>
            <Input
              id="trellis-url"
              name="trellisApiUrl"
              defaultValue={trellisApiUrl}
              placeholder="http://trellis.example.com:8128"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trellis-token">API Token</Label>
            <Input
              id="trellis-token"
              name="trellisApiToken"
              type="password"
              placeholder={hasTrellisToken ? '********' : 'Enter your Trellis token'}
              disabled={!canEdit}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to keep the current token.
            </p>
          </div>
        </div>
      </Card>

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {message.text}
        </p>
      )}

      {canEdit && (
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </form>
  )
}
