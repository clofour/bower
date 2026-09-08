'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/lib/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    try {
      const result = await loginAction(formData)
      if (result?.error) setError(result.error)
    } catch {
      setError('Bower could not reach the control plane. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Control plane access</p>
        <h1 className="text-3xl font-semibold tracking-[-.03em]">Welcome back</h1>
        <p className="text-sm leading-6 text-muted-foreground">Sign in to review service health and continue operations.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" id="login-error" className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="operator@example.com" autoComplete="email" required aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading} aria-disabled={loading}>
          {loading ? 'Verifying credentials…' : 'Sign in to Bower'}
        </Button>
        <p role="status" aria-live="polite" className="sr-only">{loading ? 'Signing in' : ''}</p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">Register</Link>
      </p>
    </div>
  )
}
