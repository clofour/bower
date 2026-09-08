'use client'

import { useState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/lib/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await registerAction(formData)
      if (result?.error) setError(result.error)
    } catch {
      setError('Account creation could not be completed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Join this control plane</p>
        <h1 className="text-3xl font-semibold tracking-[-.03em]">Create your account</h1>
        <p className="text-sm leading-6 text-muted-foreground">Use the instance administrator token for the first account, or an organization invitation thereafter.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" id="register-error" className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Your name" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="Minimum 8 characters" autoComplete="new-password" required minLength={8} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inviteToken">Invitation or instance-admin token</Label>
          <Input id="inviteToken" name="inviteToken" placeholder="Paste token" autoComplete="off" required aria-describedby="token-help" aria-invalid={!!error} />
          <p id="token-help" className="text-xs leading-5 text-muted-foreground">Tokens are validated securely and are never shown again here.</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading} aria-disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <p role="status" aria-live="polite" className="sr-only">{loading ? 'Creating your account' : ''}</p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
