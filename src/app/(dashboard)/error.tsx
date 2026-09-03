'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <Card className="flex flex-col items-center p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </Card>
    </div>
  )
}
