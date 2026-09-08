import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  healthy: 'bg-success',
  running: 'bg-success',
  deploying: 'bg-warning',
  pending: 'bg-warning',
  planning: 'bg-warning',
  starting: 'bg-warning',
  placed: 'bg-warning',
  stopping: 'bg-muted-foreground',
  stopped: 'bg-muted-foreground',
  completed: 'bg-muted-foreground',
  dead: 'bg-muted-foreground',
  draining: 'bg-warning',
  failed: 'bg-destructive',
  rolled_back: 'bg-destructive',
  lost: 'bg-destructive',
  unhealthy: 'bg-destructive',
  unknown: 'bg-muted-foreground',
  error: 'bg-destructive',
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const color = statusColors[status] ?? 'bg-muted-foreground'
  const pulse = ['deploying', 'pending', 'planning', 'starting', 'placed', 'draining'].includes(status)

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('inline-block h-2 w-2 rounded-full', color, pulse && 'animate-pulse')} />
      <span className="text-sm capitalize">{status.replace(/_/g, ' ')}</span>
    </span>
  )
}
