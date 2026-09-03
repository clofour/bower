import { cn } from '@/lib/utils'

const tones: Record<string, string> = {
  healthy: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  running: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  deploying: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  planning: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  starting: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  placed: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  unknown: 'border-border bg-muted text-muted-foreground',
  failed: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  unhealthy: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  lost: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  locked: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function Status({ value, dot = true, className }: { value: string; dot?: boolean; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize', tones[value] ?? tones.unknown, className)}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}{value.replaceAll('_', ' ')}
  </span>
}
