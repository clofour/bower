'use client'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="mx-auto mt-16 max-w-xl rounded-xl border border-destructive/25 bg-card p-8 text-center shadow-sm"><AlertTriangle className="mx-auto h-7 w-7 text-destructive"/><h1 className="mt-4 text-xl font-semibold">Operational data is unavailable</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Bower could not load this view. Existing workloads are not affected. Retry, or check the Trellis connection if the issue persists.</p>{error.digest && <p className="mt-3 font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}<Button className="mt-6" onClick={reset}><RotateCcw className="h-4 w-4"/> Retry</Button></div>
}
