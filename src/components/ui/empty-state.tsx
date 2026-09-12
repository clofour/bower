import * as React from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-sunken text-ink-muted">
        {icon}
      </div>
      <p className="mt-4 text-[14px] font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function InlineNotice({
  tone = 'neutral',
  icon,
  children,
  action,
}: {
  tone?: 'neutral' | 'warn' | 'danger' | 'brand'
  icon?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {
  const tones = {
    neutral: 'border-line bg-sunken text-ink-soft',
    warn: 'border-warn-200 bg-warn-50 text-warn-500',
    danger: 'border-danger-200 bg-danger-50 text-danger-500',
    brand: 'border-brand-100 bg-brand-50 text-brand-700',
  } as const
  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed', tones[tone])}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? <span className="mt-px shrink-0">{icon}</span> : null}
        <div className="min-w-0">{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
