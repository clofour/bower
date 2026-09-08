import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description: string; action?: ReactNode; className?: string }) {
  return <section className={cn('flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center', className)}>
    {icon && <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border bg-background text-muted-foreground">{icon}</div>}
    <h2 className="text-base font-semibold">{title}</h2><p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </section>
}
