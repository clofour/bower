'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrganizationAction } from '@/lib/actions/settings'

interface OrgSettingsFormProps {
  org: {
    id: string
    name: string
    slug: string
    trellisApiUrl: string
    trellisApiToken: string
  }
}

export function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    const result = await updateOrganizationAction(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-danger-50 p-3 text-sm text-danger-600">{error}</div>}
          {success && <div className="rounded-md bg-success/10 p-3 text-sm text-success">Settings updated.</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" name="name" defaultValue={org.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trellisApiUrl">Trellis API URL</Label>
            <Input id="trellisApiUrl" name="trellisApiUrl" defaultValue={org.trellisApiUrl} placeholder="https://trellis.example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trellisApiToken">Trellis API Token</Label>
            <Input id="trellisApiToken" name="trellisApiToken" type="password" defaultValue={org.trellisApiToken} />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
