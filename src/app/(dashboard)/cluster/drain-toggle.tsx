'use client'

import { useState, useTransition } from 'react'
import { setNodeDrainAction } from '@/lib/actions/operations'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export function DrainToggle({ nodeId, drain }: { nodeId: string; drain: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function update() {
    setError(null)
    startTransition(async () => {
      try { await setNodeDrainAction(nodeId, !drain) }
      catch { setError(`Could not ${drain ? 'enable scheduling' : 'start draining'}. Check the Trellis connection and try again.`) }
    })
  }

  if (drain) return <div className="inline-flex flex-col items-end gap-1"><Button variant="outline" size="sm" onClick={update} disabled={isPending}>{isPending ? 'Enabling…' : 'Enable scheduling'}</Button>{error && <span role="alert" className="max-w-48 text-xs text-destructive">{error}</span>}</div>

  return <div className="inline-flex flex-col items-end gap-1">
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="outline" size="sm" disabled={isPending}>Drain node</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Drain {nodeId}?</AlertDialogTitle><AlertDialogDescription>New workloads will stop scheduling on this node. Existing allocations may be rescheduled, reducing capacity while the drain completes.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Keep scheduling</AlertDialogCancel><AlertDialogAction onClick={update}>Start drain</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    {isPending && <span role="status" className="text-xs text-muted-foreground">Requesting drain…</span>}
    {error && <span role="alert" className="max-w-48 text-xs text-destructive">{error}</span>}
  </div>
}
