'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Deployments', href: '/deployments' },
  { label: 'Environments', href: '/environments' },
  { label: 'Secrets', href: '/secrets' },
  { label: 'Routes', href: '/routes' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Settings', href: '/settings' },
]

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/projects/${slug}`

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0" aria-label="Project sections">
      {tabs.map((tab) => {
        const href = tab.href ? `${base}${tab.href}` : base
        const isActive =
          tab.href === ''
            ? pathname === base
            : pathname.startsWith(`${base}${tab.href}`)

        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'pb-2.5 pt-1 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
