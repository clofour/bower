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
    <header className={cn('flex flex-col items-start justify-between gap-4 sm:flex-row', className)}>
      <div className="space-y-1.5">
        {eyebrow && <p className="text-xs font-medium uppercase tracking-[.14em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-[-.025em] sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
