import Link from 'next/link'
import type { ReactNode } from 'react'
import { Boxes, Plus } from 'lucide-react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  padded = false,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={'panel ' + className + (padded ? ' padded' : '')}>
      {title || action ? (
        <div className="panel-header">
          <div>
            {title ? <h2 className="panel-title">{title}</h2> : null}
            {subtitle ? <div className="panel-subtitle">{subtitle}</div> : null}
          </div>
          {action}
        </div>
      ) : null}
      {title || action ? <div className="panel-body">{children}</div> : children}
    </section>
  )
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: ReactNode
  value: ReactNode
  detail?: ReactNode
}) {
  return (
    <div className="panel metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {detail ? <div className="metric-detail">{detail}</div> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string
  description: string
  href?: string
  actionLabel?: string
}) {
  return (
    <div className="empty">
      <div className="empty-icon"><Boxes size={18} /></div>
      <div className="empty-title">{title}</div>
      <div>{description}</div>
      {href && actionLabel ? (
        <div style={{ marginTop: 14 }}>
          <Link className="button button-primary button-sm" href={href}><Plus size={13} />{actionLabel}</Link>
        </div>
      ) : null}
    </div>
  )
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'blue' }) {
  const suffix = tone === 'default' ? '' : ' pill-' + tone
  return <span className={'pill' + suffix}>{children}</span>
}

export function statusTone(status?: string | null): 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'blue' {
  if (!status) return 'default'
  if (['healthy', 'running', 'completed', 'active'].includes(status)) return 'success'
  if (['pending', 'planning', 'deploying', 'starting', 'stopping', 'draining', 'unknown'].includes(status)) return 'warning'
  if (['failed', 'unhealthy', 'lost', 'error', 'dead'].includes(status)) return 'danger'
  if (['rolled_back', 'stopped'].includes(status)) return 'blue'
  return 'default'
}

export function StatusPill({ status }: { status?: string | null }) {
  return <Pill tone={statusTone(status)}>{(status || 'unknown').replaceAll('_', ' ')}</Pill>
}

export function KeyValue({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="key-value">
      <div className="key-label">{label}</div>
      <div className="key-content">{children}</div>
    </div>
  )
}

export function formatDate(value?: Date | string | null) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatBytes(bytes?: number | null) {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return bytes + ' B'
  const units = ['KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes / 1024
  let unit = units[0]
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024
    unit = units[i]
  }
  return value.toFixed(value >= 10 ? 0 : 1) + ' ' + unit
}

export function percent(used?: number | null, total?: number | null) {
  if (!used || !total) return 0
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)))
}
