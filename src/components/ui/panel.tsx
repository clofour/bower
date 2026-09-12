import * as React from 'react'
import { cn } from '@/lib/utils'

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface shadow-card', className)} {...rest}>
      {children}
    </div>
  )
}

interface PanelHeaderProps {
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
  as?: 'h2' | 'h3'
}

export function PanelHeader({ title, hint, action, className, as: Heading = 'h2' }: PanelHeaderProps) {
  return (
    <div className={cn('flex min-h-[52px] items-center justify-between gap-4 border-b border-line px-4', className)}>
      <div className="min-w-0">
        <Heading className="truncate text-[13px] font-semibold tracking-tight text-ink">
          {title}
        </Heading>
        {hint ? <p className="mt-0.5 truncate text-xs text-ink-muted">{hint}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-lg font-semibold tracking-tight text-ink', className)}>
      {children}
    </h2>
  )
}

export function KeyValue({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 py-2.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={cn('mt-1 truncate text-[13px] text-ink', mono && 'font-mono text-[12.5px]')}>
        {children}
      </dd>
    </div>
  )
}
