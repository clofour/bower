import type { ReactNode } from 'react'

export function PageHeading({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: string; description: string; actions?: ReactNode
}) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      {eyebrow && <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-5 flex items-end justify-between gap-4">
    <div><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
    {action}
  </div>
}
