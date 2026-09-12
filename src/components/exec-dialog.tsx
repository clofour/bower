'use client'

import { useState } from 'react'
import { execAllocationAction } from '@/lib/actions/services'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Terminal } from 'lucide-react'

interface ExecResult {
  exit_code: number
  stdout: string
  stderr: string
}

export function ExecDialog({ allocationId, serviceConfigId }: { allocationId: string; serviceConfigId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExecResult | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    const formData = new FormData(e.currentTarget)
    const command = String(formData.get('command') ?? '').split(/\s+/).filter(Boolean)
    const res = await execAllocationAction(serviceConfigId, allocationId, command[0], command)
    setResult(res as ExecResult)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Terminal className="mr-1.5 h-3.5 w-3.5" />
          Exec
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Execute command</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="command">Command</Label>
            <Input id="command" name="command" placeholder="ls -la" required className="font-mono" />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Running...' : 'Run'}
          </Button>
        </form>
        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-muted">Exit code:</span>
              <span className={result.exit_code === 0 ? 'text-success' : 'text-danger-600'}>
                {result.exit_code}
              </span>
            </div>
            {result.stdout && (
              <pre className="max-h-64 overflow-auto rounded-md bg-sunken p-3 font-mono text-xs">{result.stdout}</pre>
            )}
            {result.stderr && (
              <pre className="max-h-64 overflow-auto rounded-md bg-danger-50 p-3 font-mono text-xs text-danger-600">{result.stderr}</pre>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
