import { cn } from '@/lib/utils'

interface PageHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeading({ eyebrow, title, description, actions, className }: PageHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        {eyebrow && <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
