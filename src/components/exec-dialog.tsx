'use client'

import { useState, useTransition } from 'react'
import { TerminalSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { execAllocationAction } from '@/lib/actions/services'
import type { TrellisAllocation } from '@/types/trellis'

interface ExecDialogProps {
  serviceId: string
  allocations: TrellisAllocation[]
}

export function ExecDialog({ serviceId, allocations }: ExecDialogProps) {
  const [open, setOpen] = useState(false)
  const [allocationId, setAllocationId] = useState(allocations[0]?.id ?? '')
  const [task, setTask] = useState('')
  const [command, setCommand] = useState('/bin/sh')
  const [result, setResult] = useState<{ stdout: string; stderr: string; exit_code: number } | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setError('')
    const parts = command.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return
    startTransition(async () => {
      try {
        const res = await execAllocationAction(serviceId, allocationId, task, parts)
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Exec failed.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setResult(null); setError('') } }}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={allocations.length === 0}>
          <TerminalSquare className="mr-2 h-4 w-4" />Exec
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execute command</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {allocations.length > 1 && (
            <div>
              <Label>Allocation</Label>
              <select
                value={allocationId}
                onChange={(e) => setAllocationId(e.target.value)}
                className="mt-2 h-9 w-full rounded-md border bg-background px-3 font-mono text-sm"
              >
                {allocations.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id.slice(0, 16)} · {a.phase}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="exec-task">Task name</Label>
            <Input
              id="exec-task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="web"
              className="mt-2 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="exec-command">Command</Label>
            <Input
              id="exec-command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="/bin/sh"
              className="mt-2 font-mono"
            />
          </div>
          <Button type="submit" disabled={isPending || !allocationId || !task}>
            {isPending ? 'Running…' : 'Run'}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {result && (
          <div className="mt-4 space-y-3">
            {result.stdout && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stdout</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{result.stdout}</pre>
              </div>
            )}
            {result.stderr && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stderr</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs text-destructive">{result.stderr}</pre>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Exit code: <span className="font-mono">{result.exit_code}</span></p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
